/**
 * Batch Import Pre-Approved Mentors Script
 *
 * Imports mentors from CSV, creates approved form submissions,
 * generates invitation codes, and sends registration emails.
 *
 * Usage:
 *   npx tsx scripts/batch-import-mentors.ts <adminUserId> [--dry-run]
 *
 * Examples:
 *   npx tsx scripts/batch-import-mentors.ts 1 --dry-run
 *   npx tsx scripts/batch-import-mentors.ts 1
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../lib/db/drizzle';
import {
  mentorFormSubmissions,
  invitationCodes,
  activityLogs,
  ActivityType,
} from '../lib/db/schema';
import { sendInvitationCodeEmail } from '../lib/email/service';
import { eq } from 'drizzle-orm';

// Inline invitation code generator (avoids 'use server' import)
function generateCodeString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SHP-';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 2) code += '-';
  }
  return code;
}

function mapGender(value: string): 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other' | null {
  const lower = value.trim().toLowerCase();
  if (lower === 'female') return 'female';
  if (lower === 'male') return 'male';
  return null;
}

const VALID_MBTI = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

function mapMbti(value: string): typeof VALID_MBTI[number] | null {
  const upper = value.trim().toUpperCase();
  if (VALID_MBTI.includes(upper as typeof VALID_MBTI[number])) {
    return upper as typeof VALID_MBTI[number];
  }
  return null;
}

function parseCommaSeparated(value: string): string[] {
  if (!value || !value.trim()) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function orNull(value: string): string | null {
  return value && value.trim() ? value.trim() : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface CsvRow {
  'Full Name': string;
  'Email Address': string;
  'Phone Number': string;
  'Gender': string;
  'Job Title': string;
  'Organisation': string;
  'LinkedIn URL': string;
  'Long Term Goal': string;
  'First Short Term Goal': string;
  'Outcome': string;
  'Industry Preferences': string;
  'Mentee Type': string;
  'Personality Type': string;
  'First Basic Soft Skill': string;
  'First Basic Industry Skill': string;
  'Second Basic Industry Skill': string;
  'First Expert Soft Skill': string;
  'First Expert Industry Skill': string;
  'Second Expert Industry Skill': string;
}

async function batchImportMentors(adminUserId: number, dryRun: boolean) {
  console.log('\n📋 Batch Import Pre-Approved Mentors\n');
  console.log('═══════════════════════════════════════════');
  console.log(`  Admin User ID: ${adminUserId}`);
  console.log(`  Dry Run: ${dryRun}`);
  console.log('═══════════════════════════════════════════\n');

  // Read and parse CSV
  const csvPath = path.resolve(__dirname, '../Mentors 2026 first program - Mentors.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 Found ${rows.length} rows in CSV\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row['Email Address']?.trim();
    const fullName = row['Full Name']?.trim();

    if (!email || !fullName) {
      console.log(`  ⚠️  Row ${i + 1}: Missing email or name, skipping`);
      skipped++;
      continue;
    }

    console.log(`\n[${i + 1}/${rows.length}] Processing: ${fullName} <${email}>`);

    try {
      // Check for duplicates
      const existing = await db
        .select()
        .from(mentorFormSubmissions)
        .where(eq(mentorFormSubmissions.email, email))
        .limit(1);

      if (existing.length > 0) {
        const status = existing[0].status;
        if (status === 'approved' || status === 'submitted') {
          console.log(`  ⏭️  Already exists with status '${status}', skipping`);
          skipped++;
          continue;
        }
        if (status === 'rejected') {
          console.log(`  🔄 Existing record with status 'rejected', will update`);
        }
      }

      // Build skills arrays
      const softSkillsBasic = [row['First Basic Soft Skill']].filter(Boolean).map(s => s.trim()).filter(Boolean);
      const industrySkillsBasic = [row['First Basic Industry Skill'], row['Second Basic Industry Skill']].filter(Boolean).map(s => s.trim()).filter(Boolean);
      const softSkillsExpert = [row['First Expert Soft Skill']].filter(Boolean).map(s => s.trim()).filter(Boolean);
      const industrySkillsExpert = [row['First Expert Industry Skill'], row['Second Expert Industry Skill']].filter(Boolean).map(s => s.trim()).filter(Boolean);

      const formData = {
        email,
        fullName,
        phone: orNull(row['Phone Number']),
        gender: mapGender(row['Gender']),
        jobTitle: orNull(row['Job Title']),
        company: orNull(row['Organisation']),
        linkedinUrl: orNull(row['LinkedIn URL']),
        expectedMenteeGoalsLongTerm: orNull(row['Long Term Goal']),
        expectedMenteeGoalsShortTerm: orNull(row['First Short Term Goal']),
        programExpectations: orNull(row['Outcome']),
        preferredIndustries: parseCommaSeparated(row['Industry Preferences']),
        preferredMenteeTypes: parseCommaSeparated(row['Mentee Type']),
        mbtiType: mapMbti(row['Personality Type']),
        softSkillsBasic,
        industrySkillsBasic,
        softSkillsExpert,
        industrySkillsExpert,
        // Defaults for missing fields
        yearsExperience: null as number | null,
        availabilityHoursPerMonth: 4,
        maxMentees: 3,
      };

      if (dryRun) {
        console.log(`  [DRY RUN] Would insert form submission`);
        console.log(`    Gender: ${formData.gender}, MBTI: ${formData.mbtiType}`);
        console.log(`    Skills basic: ${softSkillsBasic.length} soft, ${industrySkillsBasic.length} industry`);
        console.log(`    Skills expert: ${softSkillsExpert.length} soft, ${industrySkillsExpert.length} industry`);
        console.log(`    Industries: ${formData.preferredIndustries.join('; ')}`);
        console.log(`  [DRY RUN] Would approve and generate invitation code`);
        console.log(`  [DRY RUN] Would send email to ${email}`);
        inserted++;
        continue;
      }

      const now = new Date();
      let formId: number;

      if (existing.length > 0 && existing[0].status === 'rejected') {
        // Update rejected record
        const [updated] = await db
          .update(mentorFormSubmissions)
          .set({
            ...formData,
            status: 'approved' as const,
            submittedAt: now,
            reviewedAt: now,
            reviewedBy: adminUserId,
            reviewNotes: 'Batch import - pre-approved offline',
            updatedAt: now,
          })
          .where(eq(mentorFormSubmissions.id, existing[0].id))
          .returning({ id: mentorFormSubmissions.id });
        formId = updated.id;
        console.log(`  ✓ Updated existing record (id: ${formId})`);
      } else {
        // Insert new record (directly as approved)
        const [record] = await db
          .insert(mentorFormSubmissions)
          .values({
            ...formData,
            status: 'approved' as const,
            submittedAt: now,
            reviewedAt: now,
            reviewedBy: adminUserId,
            reviewNotes: 'Batch import - pre-approved offline',
          })
          .returning({ id: mentorFormSubmissions.id });
        formId = record.id;
        console.log(`  ✓ Inserted form submission (id: ${formId})`);
      }

      // Log activity
      await db.insert(activityLogs).values({
        userId: adminUserId,
        action: ActivityType.REVIEW_APPLICATION,
        entityType: 'mentor_form_submission',
        entityId: formId,
        metadata: { action: 'batch_import_approve', email, fullName },
      });

      // Generate invitation code
      const code = generateCodeString();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(invitationCodes).values({
        code,
        codeType: 'mentor_approved',
        status: 'active',
        maxUses: 1,
        currentUses: 0,
        expiresAt,
        generatedBy: adminUserId,
        generatedFor: email,
        targetRole: 'mentor',
        linkedFormId: formId,
        linkedFormType: 'mentor',
        notes: `Batch import for ${fullName}`,
      });

      console.log(`  ✓ Generated invitation code: ${code} (expires: ${expiresAt.toLocaleDateString('en-NZ')})`);

      // Log code generation
      await db.insert(activityLogs).values({
        userId: adminUserId,
        action: ActivityType.GENERATE_INVITATION_CODE,
        entityType: 'invitation_code',
        metadata: { code, email, fullName, formId },
      });

      // Send email
      await sendInvitationCodeEmail(email, {
        invitationCode: code,
        codeType: 'mentor_approved',
        expiresAt,
        message: `Welcome to the She Sharp Mentorship Program 2026! Your mentor application has been pre-approved. Please complete your registration using the link below.`,
      });

      console.log(`  ✓ Sent invitation email to ${email}`);

      inserted++;

      // Rate limit delay (500ms between emails)
      if (i < rows.length - 1) {
        await sleep(500);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${fullName} <${email}>:`, error);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`  ✅ Processed: ${inserted}`);
  console.log(`  ⏭️  Skipped:   ${skipped}`);
  console.log(`  ❌ Failed:    ${failed}`);
  console.log(`  📄 Total:     ${rows.length}`);
  console.log('═══════════════════════════════════════════\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const adminUserId = parseInt(args.find(a => !a.startsWith('--')) || '', 10);

  if (isNaN(adminUserId)) {
    console.error('\n❌ Error: Missing or invalid adminUserId');
    console.log('\n📖 Usage:');
    console.log('   npx tsx scripts/batch-import-mentors.ts <adminUserId> [--dry-run]\n');
    console.log('📝 Examples:');
    console.log('   npx tsx scripts/batch-import-mentors.ts 1 --dry-run');
    console.log('   npx tsx scripts/batch-import-mentors.ts 1\n');
    process.exit(1);
  }

  try {
    await batchImportMentors(adminUserId, dryRun);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
