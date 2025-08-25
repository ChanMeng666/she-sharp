# She Sharp Project Architecture Diagrams

This document contains mermaid diagrams showcasing the system architecture, database structure, and business logic of the She Sharp project.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Database Entity Relationship Diagram](#database-entity-relationship-diagram)
3. [User Roles and Permissions Architecture](#user-roles-and-permissions-architecture)
4. [Mentorship Relationship Business Process](#mentorship-relationship-business-process)
5. [Event Management System Flow](#event-management-system-flow)
6. [Resource Management System](#resource-management-system)
7. [Authentication and Authorization Flow](#authentication-and-authorization-flow)
8. [Membership Subscription System](#membership-subscription-system)

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface Components]
        Pages[Page Routing]
        Hooks[Custom Hooks]
    end
    
    subgraph "API Layer"
        Auth[Authentication API]
        Mentorship[Mentorship API]
        Events[Events API]
        Resources[Resources API]
        Admin[Admin API]
        Analytics[Analytics API]
    end
    
    subgraph "Business Logic Layer"
        AuthService[Authentication Service]
        MentorshipService[Mentorship Service]
        EventService[Event Service]
        ResourceService[Resource Service]
        NotificationService[Notification Service]
        PaymentService[Payment Service]
    end
    
    subgraph "Data Access Layer"
        DrizzleORM[Drizzle ORM]
        Queries[Query Layer]
        Migrations[Database Migrations]
    end
    
    subgraph "Data Storage Layer"
        PostgreSQL[(PostgreSQL)]
        FileStorage[File Storage]
        Cache[Cache]
    end
    
    subgraph "External Services"
        Stripe[Stripe Payments]
        GoogleAI[Google Gemini AI]
        Email[Email Service]
        OAuth[OAuth Providers]
    end
    
    UI --> Pages
    Pages --> Hooks
    Hooks --> API
    API --> AuthService
    API --> MentorshipService
    API --> EventService
    API --> ResourceService
    AuthService --> DrizzleORM
    MentorshipService --> DrizzleORM
    EventService --> DrizzleORM
    ResourceService --> DrizzleORM
    DrizzleORM --> PostgreSQL
    PaymentService --> Stripe
    NotificationService --> Email
    AuthService --> OAuth
```

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    users {
        serial id PK
        varchar name
        varchar email UK
        timestamp email_verified
        text image
        text password_hash
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
        timestamp last_login_at
        integer login_attempts
        timestamp locked_until
    }
    
    user_roles {
        serial id PK
        integer user_id FK
        enum role_type
        timestamp activated_at
        boolean is_active
        integer activation_step
        timestamp verified_at
    }
    
    mentor_profiles {
        serial id PK
        integer user_id FK,UK
        jsonb expertise_areas
        integer years_experience
        varchar company
        varchar job_title
        text bio
        varchar linkedin_url
        integer availability_hours_per_month
        integer max_mentees
        integer current_mentees_count
        boolean is_accepting_mentees
        timestamp profile_completed_at
        timestamp verified_at
        integer verified_by FK
    }
    
    mentee_profiles {
        serial id PK
        integer user_id FK,UK
        jsonb learning_goals
        varchar career_stage
        jsonb preferred_expertise_areas
        varchar preferred_meeting_frequency
        text bio
        text current_challenge
        timestamp profile_completed_at
    }
    
    mentorship_relationships {
        serial id PK
        integer mentor_user_id FK
        integer mentee_user_id FK
        enum status
        timestamp started_at
        timestamp ended_at
        timestamp paused_at
        varchar meeting_frequency
        timestamp next_meeting_date
        text relationship_goals
        text mentor_notes
        text mentee_notes
        timestamp created_at
        timestamp updated_at
    }
    
    meetings {
        serial id PK
        integer relationship_id FK
        timestamp scheduled_at
        integer duration_minutes
        enum meeting_type
        varchar meeting_link
        enum status
        jsonb topics_discussed
        jsonb goals_set
        jsonb action_items
        text mentor_notes
        text mentee_feedback
        integer rating
        timestamp actual_start_time
        timestamp actual_end_time
        varchar recording_url
        timestamp created_at
        timestamp updated_at
    }
    
    events {
        serial id PK
        varchar title
        text description
        enum event_type
        timestamp start_time
        timestamp end_time
        varchar timezone
        enum location_type
        jsonb location_details
        integer capacity
        integer current_registrations
        timestamp registration_deadline
        boolean waitlist_enabled
        boolean is_members_only
        enum required_membership_tier
        jsonb agenda
        jsonb speakers
        jsonb materials
        integer actual_attendance
        decimal feedback_score
        integer created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    event_registrations {
        serial id PK
        integer event_id FK
        integer user_id FK
        timestamp registered_at
        varchar role_in_event
        timestamp checked_in_at
        timestamp checked_out_at
        integer attendance_duration
        boolean feedback_submitted
        integer feedback_score
        text feedback_comments
        boolean certificate_issued
        varchar certificate_url
    }
    
    resources {
        serial id PK
        varchar title
        text description
        enum resource_type
        varchar file_url
        integer file_size
        varchar mime_type
        enum access_level
        jsonb required_roles
        jsonb categories
        jsonb tags
        integer uploaded_by FK
        timestamp uploaded_at
        timestamp last_updated
        integer download_count
        integer view_count
        decimal average_rating
    }
    
    user_memberships {
        serial id PK
        integer user_id FK,UK
        enum tier
        timestamp expires_at
        text stripe_subscription_id UK
        text stripe_customer_id
        jsonb features_access
        timestamp last_payment_at
        timestamp next_billing_date
        timestamp cancelled_at
        timestamp created_at
        timestamp updated_at
    }
    
    admin_permissions {
        serial id PK
        integer user_id FK,UK
        boolean can_view_all_data
        boolean can_edit_users
        boolean can_manage_relationships
        boolean can_access_analytics
        boolean can_manage_content
        boolean can_verify_mentors
        boolean can_manage_events
        integer granted_by FK
        timestamp granted_at
    }
    
    users ||--o{ user_roles : "has"
    users ||--o| mentor_profiles : "has"
    users ||--o| mentee_profiles : "has"
    users ||--o{ mentorship_relationships : "mentor"
    users ||--o{ mentorship_relationships : "mentee"
    mentorship_relationships ||--o{ meetings : "contains"
    users ||--o{ events : "creates"
    events ||--o{ event_registrations : "has"
    users ||--o{ event_registrations : "registers"
    users ||--o{ resources : "uploads"
    users ||--o| user_memberships : "has"
    users ||--o| admin_permissions : "has"
    mentor_profiles }o--|| users : "verified_by"
    admin_permissions }o--|| users : "granted_by"
```

---

## User Roles and Permissions Architecture

```mermaid
graph TD
    subgraph "User Role System"
        User[User Account]
        Role[Role Activation]
        MentorRole[Mentor Role]
        MenteeRole[Mentee Role]
        AdminRole[Admin Role]
    end
    
    subgraph "Role Permissions"
        MentorPermissions[Mentor Permissions]
        MenteePermissions[Mentee Permissions]
        AdminPermissions[Admin Permissions]
    end
    
    subgraph "Permission Control"
        ViewData[View Data Permission]
        EditUsers[Edit Users Permission]
        ManageRelationships[Manage Relationships Permission]
        AccessAnalytics[Access Analytics Permission]
        ManageContent[Manage Content Permission]
        VerifyMentors[Verify Mentors Permission]
        ManageEvents[Manage Events Permission]
    end
    
    User --> Role
    Role --> MentorRole
    Role --> MenteeRole
    Role --> AdminRole
    
    MentorRole --> MentorPermissions
    MenteeRole --> MenteePermissions
    AdminRole --> AdminPermissions
    
    AdminPermissions --> ViewData
    AdminPermissions --> EditUsers
    AdminPermissions --> ManageRelationships
    AdminPermissions --> AccessAnalytics
    AdminPermissions --> ManageContent
    AdminPermissions --> VerifyMentors
    AdminPermissions --> ManageEvents
    
    MentorPermissions --> ViewData
    MenteePermissions --> ViewData
```

---

## Mentorship Relationship Business Process

```mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant M as Mentor
    participant E as Mentee
    participant DB as Database
    
    Note over U,E: Mentorship Relationship Establishment Process
    
    U->>S: Apply for Mentor Role
    S->>DB: Create User Role Record
    S->>M: Send Role Activation Notification
    
    M->>S: Complete Mentor Profile
    S->>DB: Update Mentor Profile
    S->>S: Verify Mentor Qualifications
    
    E->>S: Browse Mentor List
    S->>DB: Query Available Mentors
    S->>E: Return Mentor Information
    
    E->>S: Apply for Mentorship Relationship
    S->>DB: Create Relationship Request
    S->>M: Send Application Notification
    
    M->>S: Review Application
    alt Accept Application
        S->>DB: Update Relationship Status to Active
        S->>E: Send Acceptance Notification
        S->>S: Schedule First Meeting
    else Reject Application
        S->>DB: Update Relationship Status to Rejected
        S->>E: Send Rejection Notification
    end
    
    Note over M,E: Mentorship Relationship Maintenance Process
    
    M->>S: Schedule Meeting
    S->>DB: Create Meeting Record
    S->>E: Send Meeting Invitation
    
    E->>S: Confirm Meeting
    S->>DB: Update Meeting Status
    
    M->>S: Record Meeting Content
    S->>DB: Save Meeting Record
    S->>E: Send Meeting Summary
    
    E->>S: Provide Feedback
    S->>DB: Save Feedback Information
    S->>S: Update Statistics
```

---

## Event Management System Flow

```mermaid
flowchart TD
    Start([Start]) --> CreateEvent[Create Event]
    CreateEvent --> SetEventType{Set Event Type}
    
    SetEventType -->|Workshop| WorkshopEvent[Workshop Event]
    SetEventType -->|Networking| NetworkingEvent[Networking Event]
    SetEventType -->|Training| TrainingEvent[Training Event]
    SetEventType -->|Social| SocialEvent[Social Event]
    SetEventType -->|Thrive| ThriveEvent[Thrive Event]
    
    WorkshopEvent --> SetAccess[Set Access Control]
    NetworkingEvent --> SetAccess
    TrainingEvent --> SetAccess
    SocialEvent --> SetAccess
    ThriveEvent --> SetAccess
    
    SetAccess -->|Public| PublicEvent[Public Event]
    SetAccess -->|Members Only| MembersEvent[Members Only]
    SetAccess -->|Premium| PremiumEvent[Premium Members Only]
    
    PublicEvent --> PublishEvent[Publish Event]
    MembersEvent --> PublishEvent
    PremiumEvent --> PublishEvent
    
    PublishEvent --> UserRegistration[User Registration]
    UserRegistration --> CheckCapacity{Check Capacity}
    
    CheckCapacity -->|Available| AcceptRegistration[Accept Registration]
    CheckCapacity -->|Full| WaitlistRegistration[Add to Waitlist]
    
    AcceptRegistration --> SendConfirmation[Send Confirmation]
    WaitlistRegistration --> SendWaitlist[Send Waitlist Notification]
    
    SendConfirmation --> EventDay[Event Day]
    SendWaitlist --> EventDay
    
    EventDay --> CheckIn[Check In]
    CheckIn --> EventExecution[Execute Event]
    EventExecution --> CheckOut[Check Out]
    
    CheckOut --> CollectFeedback[Collect Feedback]
    CollectFeedback --> UpdateStats[Update Statistics]
    UpdateStats --> End([End])
```

---

## Resource Management System

```mermaid
graph LR
    subgraph "Resource Upload Process"
        Upload[User Upload]
        Validate[Validate File]
        Process[Process File]
        Store[Store File]
        Index[Create Index]
    end
    
    subgraph "Resource Access Control"
        AccessRequest[Access Request]
        CheckRole[Check User Role]
        CheckMembership[Check Membership Level]
        CheckPermissions[Check Specific Permissions]
        GrantAccess[Grant Access]
    end
    
    subgraph "Resource Classification System"
        ResourceType[Resource Type]
        Categories[Category Tags]
        Tags[Tag System]
        SearchIndex[Search Index]
    end
    
    subgraph "Resource Statistics"
        ViewCount[View Count]
        DownloadCount[Download Count]
        Rating[Rating System]
        UsageAnalytics[Usage Analytics]
    end
    
    Upload --> Validate
    Validate --> Process
    Process --> Store
    Store --> Index
    
    AccessRequest --> CheckRole
    CheckRole --> CheckMembership
    CheckMembership --> CheckPermissions
    CheckPermissions --> GrantAccess
    
    ResourceType --> Categories
    Categories --> Tags
    Tags --> SearchIndex
    
    GrantAccess --> ViewCount
    GrantAccess --> DownloadCount
    GrantAccess --> Rating
    ViewCount --> UsageAnalytics
    DownloadCount --> UsageAnalytics
    Rating --> UsageAnalytics
```

---

## Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Authentication Service
    participant DB as Database
    participant O as OAuth Provider
    
    Note over U,O: User Login Process
    
    U->>F: Enter Credentials
    F->>A: Send Authentication Request
    
    alt Email Password Login
        A->>DB: Verify User Credentials
        DB->>A: Return User Information
        A->>A: Check Account Status
        A->>A: Generate JWT Token
    else OAuth Login
        A->>O: Redirect to OAuth
        O->>U: User Authorization
        O->>A: Return Authorization Code
        A->>O: Exchange Access Token
        A->>A: Get User Information
        A->>DB: Find or Create User
        A->>A: Generate JWT Token
    end
    
    A->>F: Return Authentication Result
    F->>U: Display Login Result
    
    Note over U,O: Permission Verification Process
    
    U->>F: Access Protected Resource
    F->>A: Verify JWT Token
    A->>A: Parse Token
    A->>DB: Query User Permissions
    DB->>A: Return Permission Information
    
    alt Has Permission
        A->>F: Return Permission Verification Success
        F->>U: Display Protected Content
    else No Permission
        A->>F: Return Permission Verification Failure
        F->>U: Display Insufficient Permission Message
    end
    
    Note over U,O: Session Management
    
    A->>A: Check Token Expiration
    alt Token About to Expire
        A->>A: Refresh Token
        A->>F: Return New Token
    else Token Expired
        A->>F: Return Authentication Failure
        F->>U: Redirect to Login Page
    end
```

---

## Membership Subscription System

```mermaid
graph TD
    Start([Start]) --> ChoosePlan[Choose Membership Plan]
    
    ChoosePlan -->|Free| FreePlan[Free Plan]
    ChoosePlan -->|Basic| BasicPlan[Basic Plan]
    ChoosePlan -->|Premium| PremiumPlan[Premium Plan]
    
    FreePlan --> FreeFeatures[Free Features]
    BasicPlan --> BasicFeatures[Basic Features]
    PremiumPlan --> PremiumFeatures[Premium Features]
    
    FreeFeatures --> LimitedAccess[Limited Access]
    BasicFeatures --> StandardAccess[Standard Access]
    PremiumFeatures --> FullAccess[Full Access]
    
    LimitedAccess --> UpgradePrompt[Upgrade Prompt]
    StandardAccess --> UpgradePrompt
    FullAccess --> SatisfiedUser[Satisfied User]
    
    UpgradePrompt --> PaymentFlow[Payment Process]
    PaymentFlow --> StripeIntegration[Stripe Integration]
    
    StripeIntegration --> PaymentSuccess{Payment Successful?}
    PaymentSuccess -->|Yes| ActivateMembership[Activate Membership]
    PaymentSuccess -->|No| PaymentFailed[Payment Failed]
    
    ActivateMembership --> UpdateDatabase[Update Database]
    UpdateDatabase --> SendConfirmation[Send Confirmation Email]
    SendConfirmation --> GrantAccess[Grant New Permissions]
    
    PaymentFailed --> RetryPayment[Retry Payment]
    RetryPayment --> PaymentFlow
    
    GrantAccess --> MonitorUsage[Monitor Usage]
    MonitorUsage --> RenewalReminder[Renewal Reminder]
    
    RenewalReminder --> AutoRenewal{Auto Renewal?}
    AutoRenewal -->|Yes| ProcessRenewal[Process Renewal]
    AutoRenewal -->|No| ManualRenewal[Manual Renewal]
    
    ProcessRenewal --> PaymentFlow
    ManualRenewal --> PaymentFlow
    
    SatisfiedUser --> ContinueMembership[Continue Membership]
    ContinueMembership --> MonitorUsage
```

---

## Summary

These diagrams showcase the complete architecture of the She Sharp project:

1. **System Architecture Overview**: Displays the complete technology stack from frontend to database
2. **Database Entity Relationship Diagram**: Detailed view of all data table relationships
3. **User Roles and Permissions Architecture**: Illustrates the multi-role system permission control
4. **Mentorship Relationship Business Process**: Shows the complete lifecycle of mentorship relationships
5. **Event Management System Flow**: Explains the complete process from event creation to execution
6. **Resource Management System**: Demonstrates resource upload, access control, and statistics
7. **Authentication and Authorization Flow**: Detailed explanation of user authentication and permission verification
8. **Membership Subscription System**: Shows the complete flow of membership levels and payment system

These diagrams help development teams:
- Better understand the system architecture
- Provide guidance for new feature development
- Offer reference for system maintenance and optimization
- Provide quick onboarding materials for new team members
