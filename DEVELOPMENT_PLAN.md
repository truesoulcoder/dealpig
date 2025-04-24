# DealPig Development Plan

This document outlines envisioned purpose and the planned development roadmap, testing strategy, and maintenance practices for the DealPig platform.

# The workflow goes something like this:

-user adds email account oauth tokens as "senders" (SENDERS PAGE)

-user uploads leads to be parsed and set into the supabase database (UPLOAD LEADS PAGE)

-user creates template for the body of the email in the rich text editor (TEMPLATE EDITOR PAGE)

-user creates template for the LOI letter that gets attached to that email, with options for docx or pdf document generation (TEMPLATE EDITOR PAGE)

-user configures campaign settings (which lead list to be worked, the total number of leads worked by senders, time interval between emails sent, which senders are working the campaign, and scheduled time of the day the campaign can operate) (CAMPAIGN SETTINGS PAGE)

-once all that is setup, user starts the automatic emailing (MAIN/DASHBOARD PAGE)

-once everything is setup, the dashboard will be the main page the user will operate from. user can turn on or off or pause the email campaign.

-once campaign is started, "senders" get assigned leads to be worked, equally divided amongst them

-the sender drafts an email to the lead's contacts using templates provided for body of email

-the document to be attached to the email being worked is generated "just-in-time" according to the template, making sure it matches the lead being worked, and gets attached as a pdf or docx according to user configuration

-the email is sent, and the lead is marked as worked in the supabase, along with a time stamp and information on who sent it

-the analytics are updated to reflect the kpi data showing for each sender "emails sent, emails opened, emails replied to, emails bounced".

-campaign runs according to the schedule set, automatically working through all the leads for that campaign.

-the dashboard should show the graphs and charts for the kpi analytics, and the user should be able to select which campaign to run with on/off/pause controls. and a console log should report live data reporting for each sender

-once a campaign is completed, the kpi data is preserved and logged in a final report and archived

## Current Issues

1. **Testing Framework Issues**:
   - ✅ Missing dependency `@testing-library/dom` has been installed, but tests still need fixes
   - ✅ Database test mocks don't match actual function signatures - Fixed with proper mock implementation
   - ✅ Email sending tests are failing due to incorrect mocking of Gmail API - Fixed with comprehensive Gmail API mocking
   - ✅ Document generation tests failing due to docx.Header constructor issues - Fixed with proper docx library mocking

2. **React Version Compatibility**:
   - ✅ The `react-draft-wysiwyg` package has been replaced with TipTap editor which is compatible with React 19
   - ✅ No longer bypassing with `--legacy-peer-deps` for editor dependency

3. **Security Issues**:
   - npm audit shows vulnerabilities that need to be addressed, but it seems they can't be patched without breaking the app

## Short-term Improvements (1-3 months)

1. **Fix Testing Framework**:
   - ✅ Update test mocks to match actual function signatures
   - ✅ Implement proper mocking for Gmail API and docx library
   - Aim for >80% test coverage

2. **Security Hardening**:
   - ✅ Address npm vulnerabilities (primary packages updated, some Vercel dependencies still require fixing)
   - ✅ Implement proper CSRF protection (added iron-session based CSRF tokens)
   - ✅ Add rate limiting to API endpoints (implemented tiered rate limiting system)
   - ✅ Complete security audit (added security headers and CSP policy)
   - Apply additional security best practices

3. **UI/UX Improvements**:
   - Mobile responsiveness improvements
   - Error message standardization

4. **Performance Optimization**:
   - Optimize database queries
   - Implement caching for frequently accessed data
   - Use React Query for data fetching
   - Optimize bundle size

## Mid-term Improvements (3-6 months)

1. **Feature Enhancements**:
   - ✅ Advanced search and filtering - Implemented in LeadsTable with status and email status filters
   - ✅ Custom document templates - Implemented with template selection and editing in DocumentPreview
   - ❌ Email scheduling - Not yet implemented
   - ❌ Pipeline visualization - Not yet implemented

2. **Technical Debt**:
   - ✅ Replace `react-draft-wysiwyg` with React 19 compatible editor - Implemented TipTap editor in document editing components
   - ✅ Migrate to typed API endpoints with tRPC - Implemented across all API endpoints
   - ✅ Component library standardization - Consistently using NextUI/HeroUI components
   - ✅ Extract shared logic to custom hooks - Implemented hooks for common functionality

##  Long-term improvements: Advanced features (tbd)
   - Document OCR and parsing: for users to upload sample templates
   - Microservices architecture (?)
   - Serverless functions (?)

### Unit Tests
- **Component Tests**: Test individual React components in isolation
- **Function Tests**: Test utility functions and helpers
- **Hook Tests**: Test custom React hooks

### Integration Tests
- **API Tests**: Ensure API endpoints work correctly
- **Form Tests**: Test form submissions and validation
- **State Management Tests**: Ensure state changes correctly

### End-to-End Tests
- Implement Cypress for key user journeys
- Test authentication flow
- Test lead management flow
- Test document generation and email sending

### Performance Tests
- Load testing with k6
- Lighthouse scores monitoring
- Bundle size monitoring

## Deployment Pipeline

1. **Development Environment**
   - Local development
   - Feature branches

2. **Testing Environment**
   - Automated tests run
   - Integration testing
   - Staging environment

3. **Production Environment**
   - Vercel production deployment
   - Feature flags for controlled rollout
   - Monitoring and alerting

4. **Best Practoces**
   - Internal documentation for development processes
   - Code comments for complex logic
   - Error tracking with Sentry
   - Performance monitoring
   - User analytics
   - README and API documentation in GitHub wiki

## Conclusion

This development plan is a living document and should be updated as the project evolves. The focus should be on maintaining a high-quality, secure, and maintainable codebase while continuously delivering value to users.