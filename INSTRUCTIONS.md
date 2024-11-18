# Project Architecture & Patterns

## Company Types & Roles

### Base Company Type
- The `Company` type is used for general company records
- Companies can have both supplier and customer roles
- This type contains basic company information and relationship data (suppliers/customers arrays)

### Role-Specific Types
- `Supplier` type extends Company with supplier-specific functionality
  - Used when dealing with supplier-specific features (questionnaires, compliance, etc.)
  - Contains fields like taskProgress, complianceScore, etc.
- `Customer` type extends Company with customer-specific functionality
  - Used when dealing with customer-specific features
  - Contains customer-specific fields and behavior

### Usage Pattern
1. Use the base `Company` type when:
   - Dealing with general company information
   - Managing company relationships (suppliers/customers arrays)
   - Working with mixed company roles

2. Use the `Supplier` type when:
   - Working with supplier-specific features
   - Handling supplier compliance
   - Managing supplier questionnaires
   - Dealing with supplier products

3. Use the `Customer` type when:
   - Working with customer-specific features
   - Managing customer products
   - Handling customer-specific functionality

This pattern ensures clear separation of concerns while maintaining flexibility in company roles.
