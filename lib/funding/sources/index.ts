import type { FundingSource } from '../types';
import { beehiveSource } from './beehive-rss';
import { treasurySource } from './treasury-rss';
import { getsSource } from './gets-rss';
import { dataGovtSource } from './data-govt-ckan';
import { mbieSource } from './mbie-html';
import { womenGovtSource } from './women-govt-html';

export const FUNDING_SOURCES: ReadonlyArray<FundingSource> = [
  beehiveSource,
  treasurySource,
  getsSource,
  dataGovtSource,
  mbieSource,
  womenGovtSource,
];
