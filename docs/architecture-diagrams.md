# She Sharp 项目架构图表

本文档包含了 She Sharp 项目的系统架构、数据库结构和业务逻辑的 mermaid 图表。

## 目录

1. [系统架构概览](#系统架构概览)
2. [数据库实体关系图](#数据库实体关系图)
3. [用户角色和权限架构](#用户角色和权限架构)
4. [导师关系业务流程](#导师关系业务流程)
5. [事件管理系统流程](#事件管理系统流程)
6. [资源管理系统](#资源管理系统)
7. [认证和授权流程](#认证和授权流程)
8. [会员订阅系统](#会员订阅系统)

---

## 系统架构概览

```mermaid
graph TB
    subgraph "前端层 (Frontend)"
        UI[用户界面组件]
        Pages[页面路由]
        Hooks[自定义Hooks]
    end
    
    subgraph "API层 (API Layer)"
        Auth[认证API]
        Mentorship[导师关系API]
        Events[事件API]
        Resources[资源API]
        Admin[管理API]
        Analytics[分析API]
    end
    
    subgraph "业务逻辑层 (Business Logic)"
        AuthService[认证服务]
        MentorshipService[导师关系服务]
        EventService[事件服务]
        ResourceService[资源服务]
        NotificationService[通知服务]
        PaymentService[支付服务]
    end
    
    subgraph "数据访问层 (Data Access)"
        DrizzleORM[Drizzle ORM]
        Queries[查询层]
        Migrations[数据库迁移]
    end
    
    subgraph "数据存储层 (Data Storage)"
        PostgreSQL[(PostgreSQL)]
        FileStorage[文件存储]
        Cache[缓存]
    end
    
    subgraph "外部服务 (External Services)"
        Stripe[Stripe支付]
        GoogleAI[Google Gemini AI]
        Email[邮件服务]
        OAuth[OAuth提供商]
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

## 数据库实体关系图

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

## 用户角色和权限架构

```mermaid
graph TD
    subgraph "用户角色系统"
        User[用户账户]
        Role[角色激活]
        MentorRole[导师角色]
        MenteeRole[学员角色]
        AdminRole[管理员角色]
    end
    
    subgraph "角色权限"
        MentorPermissions[导师权限]
        MenteePermissions[学员权限]
        AdminPermissions[管理员权限]
    end
    
    subgraph "权限控制"
        ViewData[查看数据权限]
        EditUsers[编辑用户权限]
        ManageRelationships[管理关系权限]
        AccessAnalytics[访问分析权限]
        ManageContent[管理内容权限]
        VerifyMentors[验证导师权限]
        ManageEvents[管理事件权限]
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

## 导师关系业务流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as 系统
    participant M as 导师
    participant E as 学员
    participant DB as 数据库
    
    Note over U,E: 导师关系建立流程
    
    U->>S: 申请导师角色
    S->>DB: 创建用户角色记录
    S->>M: 发送角色激活通知
    
    M->>S: 完善导师资料
    S->>DB: 更新导师档案
    S->>S: 验证导师资格
    
    E->>S: 浏览导师列表
    S->>DB: 查询可用导师
    S->>E: 返回导师信息
    
    E->>S: 申请导师关系
    S->>DB: 创建关系请求
    S->>M: 发送申请通知
    
    M->>S: 审核申请
    alt 接受申请
        S->>DB: 更新关系状态为active
        S->>E: 发送接受通知
        S->>S: 安排首次会议
    else 拒绝申请
        S->>DB: 更新关系状态为rejected
        S->>E: 发送拒绝通知
    end
    
    Note over M,E: 导师关系维护流程
    
    M->>S: 安排会议
    S->>DB: 创建会议记录
    S->>E: 发送会议邀请
    
    E->>S: 确认会议
    S->>DB: 更新会议状态
    
    M->>S: 记录会议内容
    S->>DB: 保存会议记录
    S->>E: 发送会议总结
    
    E->>S: 提供反馈
    S->>DB: 保存反馈信息
    S->>S: 更新统计数据
```

---

## 事件管理系统流程

```mermaid
flowchart TD
    Start([开始]) --> CreateEvent[创建事件]
    CreateEvent --> SetEventType{设置事件类型}
    
    SetEventType -->|Workshop| WorkshopEvent[工作坊事件]
    SetEventType -->|Networking| NetworkingEvent[社交网络事件]
    SetEventType -->|Training| TrainingEvent[培训事件]
    SetEventType -->|Social| SocialEvent[社交事件]
    SetEventType -->|Thrive| ThriveEvent[成长事件]
    
    WorkshopEvent --> SetAccess[设置访问权限]
    NetworkingEvent --> SetAccess
    TrainingEvent --> SetAccess
    SocialEvent --> SetAccess
    ThriveEvent --> SetAccess
    
    SetAccess -->|Public| PublicEvent[公开事件]
    SetAccess -->|Members Only| MembersEvent[会员专属]
    SetAccess -->|Premium| PremiumEvent[高级会员专属]
    
    PublicEvent --> PublishEvent[发布事件]
    MembersEvent --> PublishEvent
    PremiumEvent --> PublishEvent
    
    PublishEvent --> UserRegistration[用户注册]
    UserRegistration --> CheckCapacity{检查容量}
    
    CheckCapacity -->|有位置| AcceptRegistration[接受注册]
    CheckCapacity -->|已满| WaitlistRegistration[加入候补名单]
    
    AcceptRegistration --> SendConfirmation[发送确认]
    WaitlistRegistration --> SendWaitlist[发送候补通知]
    
    SendConfirmation --> EventDay[活动当天]
    SendWaitlist --> EventDay
    
    EventDay --> CheckIn[签到]
    CheckIn --> EventExecution[执行活动]
    EventExecution --> CheckOut[签退]
    
    CheckOut --> CollectFeedback[收集反馈]
    CollectFeedback --> UpdateStats[更新统计数据]
    UpdateStats --> End([结束])
```

---

## 资源管理系统

```mermaid
graph LR
    subgraph "资源上传流程"
        Upload[用户上传]
        Validate[验证文件]
        Process[处理文件]
        Store[存储文件]
        Index[建立索引]
    end
    
    subgraph "资源访问控制"
        AccessRequest[访问请求]
        CheckRole[检查用户角色]
        CheckMembership[检查会员等级]
        CheckPermissions[检查具体权限]
        GrantAccess[授予访问权限]
    end
    
    subgraph "资源分类系统"
        ResourceType[资源类型]
        Categories[分类标签]
        Tags[标签系统]
        SearchIndex[搜索索引]
    end
    
    subgraph "资源统计"
        ViewCount[查看次数]
        DownloadCount[下载次数]
        Rating[评分系统]
        UsageAnalytics[使用分析]
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

## 认证和授权流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as 认证服务
    participant DB as 数据库
    participant O as OAuth提供商
    
    Note over U,O: 用户登录流程
    
    U->>F: 输入凭据
    F->>A: 发送认证请求
    
    alt 邮箱密码登录
        A->>DB: 验证用户凭据
        DB->>A: 返回用户信息
        A->>A: 检查账户状态
        A->>A: 生成JWT令牌
    else OAuth登录
        A->>O: 重定向到OAuth
        O->>U: 用户授权
        O->>A: 返回授权码
        A->>O: 交换访问令牌
        A->>A: 获取用户信息
        A->>DB: 查找或创建用户
        A->>A: 生成JWT令牌
    end
    
    A->>F: 返回认证结果
    F->>U: 显示登录结果
    
    Note over U,O: 权限验证流程
    
    U->>F: 访问受保护资源
    F->>A: 验证JWT令牌
    A->>A: 解析令牌
    A->>DB: 查询用户权限
    DB->>A: 返回权限信息
    
    alt 有权限
        A->>F: 返回权限验证成功
        F->>U: 显示受保护内容
    else 无权限
        A->>F: 返回权限验证失败
        F->>U: 显示权限不足提示
    end
    
    Note over U,O: 会话管理
    
    A->>A: 检查令牌过期
    alt 令牌即将过期
        A->>A: 刷新令牌
        A->>F: 返回新令牌
    else 令牌已过期
        A->>F: 返回认证失败
        F->>U: 重定向到登录页
    end
```

---

## 会员订阅系统

```mermaid
graph TD
    Start([开始]) --> ChoosePlan[选择会员计划]
    
    ChoosePlan -->|Free| FreePlan[免费计划]
    ChoosePlan -->|Basic| BasicPlan[基础计划]
    ChoosePlan -->|Premium| PremiumPlan[高级计划]
    
    FreePlan --> FreeFeatures[免费功能]
    BasicPlan --> BasicFeatures[基础功能]
    PremiumPlan --> PremiumFeatures[高级功能]
    
    FreeFeatures --> LimitedAccess[有限访问]
    BasicFeatures --> StandardAccess[标准访问]
    PremiumFeatures --> FullAccess[完全访问]
    
    LimitedAccess --> UpgradePrompt[升级提示]
    StandardAccess --> UpgradePrompt
    FullAccess --> SatisfiedUser[满意用户]
    
    UpgradePrompt --> PaymentFlow[支付流程]
    PaymentFlow --> StripeIntegration[Stripe集成]
    
    StripeIntegration --> PaymentSuccess{支付成功?}
    PaymentSuccess -->|是| ActivateMembership[激活会员资格]
    PaymentSuccess -->|否| PaymentFailed[支付失败]
    
    ActivateMembership --> UpdateDatabase[更新数据库]
    UpdateDatabase --> SendConfirmation[发送确认邮件]
    SendConfirmation --> GrantAccess[授予新权限]
    
    PaymentFailed --> RetryPayment[重试支付]
    RetryPayment --> PaymentFlow
    
    GrantAccess --> MonitorUsage[监控使用情况]
    MonitorUsage --> RenewalReminder[续费提醒]
    
    RenewalReminder --> AutoRenewal{自动续费?}
    AutoRenewal -->|是| ProcessRenewal[处理续费]
    AutoRenewal -->|否| ManualRenewal[手动续费]
    
    ProcessRenewal --> PaymentFlow
    ManualRenewal --> PaymentFlow
    
    SatisfiedUser --> ContinueMembership[继续会员]
    ContinueMembership --> MonitorUsage
```

---

## 总结

这些图表展示了 She Sharp 项目的完整架构：

1. **系统架构概览**: 展示了从前端到数据库的完整技术栈
2. **数据库实体关系图**: 详细展示了所有数据表之间的关系
3. **用户角色和权限架构**: 说明了多角色系统的权限控制
4. **导师关系业务流程**: 展示了导师关系的完整生命周期
5. **事件管理系统流程**: 说明了事件从创建到执行的完整流程
6. **资源管理系统**: 展示了资源的上传、访问控制和统计
7. **认证和授权流程**: 详细说明了用户认证和权限验证的流程
8. **会员订阅系统**: 展示了会员等级和支付系统的完整流程

这些图表可以帮助开发团队更好地理解系统架构，为新功能的开发提供指导，也为系统维护和优化提供参考。
