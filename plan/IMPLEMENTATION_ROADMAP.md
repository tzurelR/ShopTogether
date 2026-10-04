# ShopTogether - Implementation Roadmap

## Overview

This document provides a detailed, step-by-step implementation plan for building the ShopTogether application.

---

## Phase 1: AWS Account Setup & Prerequisites (Week 1)

### Day 1-2: AWS Account Configuration

- [ ] Create IAM admin user
- [ ] Configure AWS CLI locally
- [ ] Set up billing alerts and budgets
- [ ] Create development, staging, and production AWS accounts (optional, recommended for larger teams)

### Day 3: Domain & SSL Setup

- [ ] Register domain name (Route53 or external)
- [ ] Request SSL certificate via AWS Certificate Manager
- [ ] Validate certificate ownership
- [ ] Note: Certificate must be in us-east-1 for CloudFront

### Day 4-5: SES Email Configuration

- [ ] Verify sender email address or domain
- [ ] Request production access (move out of sandbox)
- [ ] Create email templates
- [ ] Set up bounce and complaint handling
- [ ] Test email sending

### Day 6-7: Development Environment

- [ ] Install Node.js (18+) and npm/yarn
- [ ] Install AWS CDK: `npm install -g aws-cdk`
- [ ] Install AWS SAM CLI (alternative)
- [ ] Set up Git repository
- [ ] Initialize project structure
- [ ] Configure IDE/editor

---

## Phase 2: Infrastructure as Code Setup (Week 2)

### Day 1-2: CDK Project Initialization

```bash
# Initialize CDK project
mkdir shoptogether-infrastructure
cd shoptogether-infrastructure
cdk init app --language=typescript

# Install dependencies
npm install @aws-cdk/aws-dynamodb
npm install @aws-cdk/aws-lambda
npm install @aws-cdk/aws-apigateway
npm install @aws-cdk/aws-cognito
npm install @aws-cdk/aws-s3
npm install @aws-cdk/aws-cloudfront
npm install @aws-cdk/aws-ses
```

### Project Structure

```
shoptogether/
├── infrastructure/               # CDK code
│   ├── lib/
│   │   ├── auth-stack.ts        # Cognito
│   │   ├── database-stack.ts    # DynamoDB
│   │   ├── api-stack.ts         # API Gateway + Lambda
│   │   ├── websocket-stack.ts   # WebSocket API
│   │   ├── frontend-stack.ts    # S3 + CloudFront
│   │   └── email-stack.ts       # SES
│   ├── bin/
│   │   └── app.ts               # CDK app entry
│   └── package.json
├── backend/                      # Lambda functions
│   ├── rest-api/
│   │   ├── lists/
│   │   ├── items/
│   │   └── share/
│   ├── websocket/
│   │   ├── connect.ts
│   │   ├── disconnect.ts
│   │   └── message.ts
│   ├── shared/
│   │   ├── db.ts                # DynamoDB client
│   │   └── auth.ts              # JWT validation
│   └── package.json
├── frontend/                     # React app
│   ├── src/
│   ├── public/
│   └── package.json
└── plan/                         # Documentation
    ├── ARCHITECTURE.md
    ├── IMPLEMENTATION_ROADMAP.md
    └── architecture-diagram.jpg
```

### Day 3-4: DynamoDB Stack

- [ ] Create DynamoDB table with single-table design
- [ ] Define PK/SK structure
- [ ] Create GSIs (UserListsIndex, TokenIndex)
- [ ] Enable DynamoDB Streams
- [ ] Enable point-in-time recovery
- [ ] Set up TTL for expired tokens
- [ ] Add billing mode (on-demand recommended)

### Day 5: Cognito Stack

- [ ] Create User Pool
- [ ] Configure sign-up attributes (email, name)
- [ ] Set password policies
- [ ] Enable email verification
- [ ] Create User Pool Client
- [ ] Configure OAuth flows (if needed)
- [ ] Set up user pool domain

### Day 6-7: Deploy Initial Infrastructure

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/REGION

# Deploy stacks
cdk deploy AuthStack
cdk deploy DatabaseStack
```

---

## Phase 3: Backend API Development (Week 3-4)

### Week 3: REST API Endpoints

#### Day 1-2: Lists API

- [ ] `POST /lists` - Create list
  - Validate input (title, type)
  - Generate unique listId
  - Store in DynamoDB
  - Return list object
- [ ] `GET /lists` - Get user's lists
  - Query by userId
  - Return paginated results
  - Include item counts
- [ ] `GET /lists/{listId}` - Get list details
  - Verify user has access
  - Fetch list metadata and items
  - Return full list object
- [ ] `PUT /lists/{listId}` - Update list
  - Validate ownership/permissions
  - Update DynamoDB
  - Return updated list
- [ ] `DELETE /lists/{listId}` - Delete list
  - Verify ownership
  - Delete all items and collaborators
  - Return success

#### Day 3-4: Items API

- [ ] `POST /lists/{listId}/items` - Add item
  - Verify write access
  - Generate unique itemId
  - Store in DynamoDB
  - Trigger real-time update
- [ ] `PUT /lists/{listId}/items/{itemId}` - Update item
  - Verify write access
  - Update item fields
  - Trigger real-time update
- [ ] `PATCH /lists/{listId}/items/{itemId}` - Toggle checked
  - Quick toggle endpoint
  - Optimized for frequent updates
- [ ] `DELETE /lists/{listId}/items/{itemId}` - Delete item
  - Verify write access
  - Remove from DynamoDB
  - Trigger real-time update

#### Day 5-6: Sharing API

- [ ] `POST /lists/{listId}/share` - Generate share invitation
  - Verify ownership
  - Generate unique token
  - Store token with expiration (7 days)
  - Send email via SES
  - Return share link
- [ ] `POST /share/accept` - Accept invitation
  - Validate token
  - Check expiration
  - Add user as collaborator
  - Mark token as used
  - Return list details
- [ ] `GET /lists/{listId}/collaborators` - List collaborators
  - Verify access
  - Return all collaborators with roles
- [ ] `DELETE /lists/{listId}/collaborators/{userId}` - Remove collaborator
  - Verify ownership
  - Remove from DynamoDB
  - Notify via email (optional)

#### Day 7: Testing & Deployment

- [ ] Write unit tests for each endpoint
- [ ] Integration tests with DynamoDB Local
- [ ] Deploy Lambda functions
- [ ] Deploy API Gateway
- [ ] Test with Postman/Insomnia

### Week 4: WebSocket API

#### Day 1-2: Connection Management

- [ ] **Connect Handler** (`$connect`)
  - Extract JWT from query string
  - Validate token with Cognito
  - Store connectionId in DynamoDB
  - Return success/failure
- [ ] **Disconnect Handler** (`$disconnect`)
  - Get connectionId
  - Remove from DynamoDB (connections + subscriptions)
  - Clean up all subscription records

#### Day 3-4: Message Handling

- [ ] **Subscribe to List**

  ```json
  {
    "action": "subscribe",
    "listId": "abc123"
  }
  ```

  - Verify user has access to list
  - Store subscription: `CONN#<connectionId>` + `SUB#<listId>`
  - Send confirmation message

- [ ] **Unsubscribe from List**

  ```json
  {
    "action": "unsubscribe",
    "listId": "abc123"
  }
  ```

  - Remove subscription record
  - Send confirmation

#### Day 5-6: Broadcast Mechanism

- [ ] Create DynamoDB Stream handler
  - Trigger on INSERT, MODIFY, DELETE
  - Extract listId from changed record
  - Query all connections subscribed to listId
  - Build update message
  - Send to all subscribers via API Gateway Management API
- [ ] Implement broadcast patterns:
  - `item.added` - New item added
  - `item.updated` - Item changed
  - `item.deleted` - Item removed
  - `item.checked` - Item toggled
  - `collaborator.joined` - New collaborator
  - `list.updated` - List metadata changed

#### Day 7: Testing

- [ ] Test WebSocket connections locally
- [ ] Test subscribe/unsubscribe
- [ ] Test real-time broadcasts with multiple clients
- [ ] Handle edge cases (stale connections, rapid updates)
- [ ] Deploy and test in AWS

---

## Phase 4: Frontend Development (Week 5-6)

### Week 5: Core UI & Authentication

#### Day 1-2: Project Setup

```bash
# Create React app
npx create-next-app@latest frontend
cd frontend

# Install dependencies
npm install @aws-amplify/auth
npm install @aws-amplify/core
npm install zustand  # State management
npm install react-query  # Server state
npm install socket.io-client  # WebSocket (or native WebSocket)
npm install tailwindcss
npm install react-hook-form
```

#### Day 3-4: Authentication UI

- [ ] Sign Up page
  - Form with email, password, name
  - Email verification flow
  - Error handling
- [ ] Sign In page
  - Email/password login
  - Remember me option
  - Forgot password link
- [ ] Forgot Password flow
  - Request reset code
  - Verify code
  - Set new password
- [ ] Protected routes
  - Redirect unauthenticated users
  - Store JWT in memory/localStorage
  - Auto-refresh tokens

#### Day 5-6: Layout & Navigation

- [ ] App shell with navigation bar
- [ ] Sidebar for list navigation
- [ ] User menu (profile, settings, logout)
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support (optional)

#### Day 7: State Management

- [ ] Set up Zustand store
  - Auth state
  - Lists state
  - Active list state
  - WebSocket connection state
- [ ] Set up React Query
  - Lists queries
  - Items queries
  - Mutations with optimistic updates

### Week 6: Lists & Real-time Features

#### Day 1-2: Lists Management

- [ ] Lists dashboard
  - Display all user's lists
  - Grid/list view toggle
  - Create new list button
  - Search/filter lists
- [ ] Create list modal
  - Form with title, type
  - Category selection (shopping, todo, etc.)
  - Submit and redirect
- [ ] Edit/delete list
  - Edit modal
  - Delete confirmation
  - Update UI optimistically

#### Day 3-4: List Items View

- [ ] List detail page
  - Display all items
  - Add item input at top
  - Checkbox to toggle completed
  - Edit/delete item actions
- [ ] Add item functionality
  - Quick add (enter key)
  - Optional: quantity, notes
  - Optimistic update
- [ ] Update item
  - Inline editing
  - Toggle checkbox
  - Real-time sync
- [ ] Delete item
  - Swipe to delete (mobile)
  - Confirmation dialog
  - Optimistic removal

#### Day 5-6: WebSocket Integration

- [ ] WebSocket client connection
  - Connect on app load
  - Pass JWT in connection
  - Handle connection state (connecting, connected, disconnected)
  - Auto-reconnect with exponential backoff
- [ ] Subscribe to active list
  - Send subscribe message when viewing list
  - Unsubscribe when leaving list
- [ ] Handle incoming messages
  - Parse message type
  - Update UI based on message
  - Show notifications for changes by others
  - Conflict resolution for simultaneous edits

#### Day 7: Sharing Features

- [ ] Share list button
  - Modal with email input
  - Send invitation
  - Display shareable link
  - Copy link to clipboard
- [ ] Accept invitation page
  - Token validation
  - Accept/decline buttons
  - Redirect to list after acceptance
- [ ] Collaborators list
  - Show all collaborators
  - Display roles
  - Remove collaborator (owner only)
  - Presence indicators (who's online)

---

## Phase 5: Email & Notifications (Week 7)

### Day 1-2: Email Templates

- [ ] Create HTML email templates
  - Welcome email
  - List invitation
  - Collaborator added
  - Password reset
- [ ] Personalize with user data
- [ ] Add branding (logo, colors)
- [ ] Test rendering in multiple email clients

### Day 3-4: Email Sending Logic

- [ ] Lambda function for sending emails
  - Template rendering
  - SES API calls
  - Error handling
  - Retry logic
- [ ] Invitation email
  - Include invitation link with token
  - Expiration notice
  - Sender name
- [ ] Test email delivery
  - Verify inbox delivery
  - Check spam filters
  - Test on multiple providers (Gmail, Outlook, etc.)

### Day 5-7: In-app Notifications

- [ ] Notification component
  - Toast/snackbar UI
  - Position (top-right recommended)
  - Auto-dismiss
- [ ] Trigger notifications
  - New collaborator joined
  - Item added by others
  - List shared with you
  - WebSocket reconnected
- [ ] Notification center (optional)
  - History of notifications
  - Mark as read
  - Clear all

---

## Phase 6: Testing & Quality Assurance (Week 8)

### Day 1-2: Unit Testing

- [ ] Backend Lambda tests
  - Mock DynamoDB calls
  - Test business logic
  - Test error handling
  - Coverage: >80%
- [ ] Frontend component tests
  - React Testing Library
  - User interactions
  - State changes
  - Coverage: >70%

### Day 3-4: Integration Testing

- [ ] API integration tests
  - Test full request/response cycles
  - Test with real DynamoDB (local)
  - Test authentication flows
- [ ] WebSocket integration tests
  - Test connection lifecycle
  - Test message broadcasting
  - Test multiple simultaneous connections

### Day 5: End-to-End Testing

- [ ] E2E test scenarios
  - User sign up and login
  - Create and share list
  - Real-time collaboration
  - Mobile responsive testing
- [ ] Use Playwright or Cypress
- [ ] Run in CI/CD pipeline

### Day 6-7: Performance & Load Testing

- [ ] Frontend performance
  - Lighthouse audit (target: >90)
  - Optimize bundle size
  - Lazy loading
  - Image optimization
- [ ] Backend load testing
  - Test API under load (Apache Bench, Artillery)
  - Test WebSocket scalability
  - Monitor Lambda cold starts
  - DynamoDB performance metrics

---

## Phase 7: Deployment & DevOps (Week 9)

### Day 1-2: CI/CD Pipeline

- [ ] Set up GitHub Actions (or CodePipeline)
  - Trigger on push to main
  - Run tests
  - Build frontend
  - Deploy infrastructure (CDK)
  - Deploy frontend to S3
  - Invalidate CloudFront cache

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: cdk deploy --all --require-approval never
      - run: aws s3 sync frontend/build s3://bucket-name
      - run: aws cloudfront create-invalidation
```

### Day 3-4: Environment Configuration

- [ ] Separate environments (dev, staging, prod)
- [ ] Environment-specific configs
  - API endpoints
  - Cognito settings
  - Feature flags
- [ ] Secrets management
  - AWS Secrets Manager
  - Environment variables in Lambda

### Day 5-6: Monitoring & Alerting

- [ ] CloudWatch Dashboards
  - Lambda invocations, errors, duration
  - API Gateway requests, latency, 4xx/5xx
  - DynamoDB read/write capacity, throttles
  - WebSocket connections, messages
- [ ] CloudWatch Alarms
  - High error rate
  - High latency
  - Low success rate
  - DynamoDB throttling
- [ ] SNS notifications
  - Email alerts
  - Slack integration (optional)

### Day 7: Production Deployment

- [ ] Final smoke tests in staging
- [ ] Deploy to production
- [ ] Monitor initial traffic
- [ ] Rollback plan in place
- [ ] DNS cutover (if applicable)

---

## Phase 8: Post-Launch (Ongoing)

### Week 10+: Enhancements & Iteration

- [ ] Collect user feedback
- [ ] Monitor error logs and fix bugs
- [ ] Optimize performance based on metrics
- [ ] Add new features based on roadmap

### Future Feature Ideas

1. **Mobile Apps**: Native iOS/Android apps
2. **Offline Support**: PWA with service workers
3. **Voice Input**: Add items via voice
4. **Smart Suggestions**: AI-powered item suggestions
5. **Recurring Lists**: Templates and recurring lists
6. **Categories**: Organize items by category
7. **Barcode Scanning**: Scan products to add
8. **Price Tracking**: Track item prices over time
9. **Store Integration**: Import from online stores
10. **Social Features**: Follow friends, public lists

### Maintenance Tasks

- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Database backups verification
- [ ] Cost optimization reviews
- [ ] Performance optimization
- [ ] Documentation updates

---

## Risk Management

### Potential Risks & Mitigations

| Risk                      | Impact | Probability | Mitigation                                       |
| ------------------------- | ------ | ----------- | ------------------------------------------------ |
| Cold start latency        | High   | Medium      | Provisioned concurrency for critical functions   |
| WebSocket disconnections  | Medium | High        | Auto-reconnect with exponential backoff          |
| DynamoDB throttling       | High   | Low         | On-demand billing, burst capacity, monitoring    |
| Email deliverability      | Medium | Medium      | Verify domain, DKIM/SPF records, monitor bounces |
| Concurrent edit conflicts | Medium | Medium      | Last-write-wins + conflict indicators in UI      |
| Security vulnerabilities  | High   | Low         | Regular security audits, dependency scanning     |
| Cost overruns             | Medium | Low         | Billing alerts, budget limits, usage monitoring  |

---

## Success Metrics

### Technical Metrics

- **Uptime**: >99.9%
- **API Latency**: p99 < 500ms
- **WebSocket Latency**: < 100ms
- **Error Rate**: < 0.1%
- **Test Coverage**: >80%

### Business Metrics

- **Active Users**: Track daily/monthly active users
- **Lists Created**: Total and per user
- **Collaboration Rate**: % of lists shared
- **User Retention**: 7-day, 30-day retention
- **Email Open Rate**: >30%

---

## Conclusion

This roadmap provides a comprehensive guide to building ShopTogether. Adjust timelines based on team size and experience. Focus on delivering a working MVP by Week 7, then iterate based on user feedback.

**Total Estimated Time**: 9-10 weeks for MVP

Good luck! 🚀
