/**
 * GraphQL Custom Scalar Type Definitions
 */

export const scalarTypeDefs = `#graphql
  # ====================
  # Custom Scalars
  # ====================
  
  """
  UUID scalar type - represents a universally unique identifier
  """
  scalar UUID
  
  """
  DateTime scalar type - represents date and time in ISO 8601 format
  """
  scalar DateTime
  
  """
  Date scalar type - represents date without time in YYYY-MM-DD format
  """
  scalar Date
  
  """
  JSON scalar type - represents arbitrary JSON data
  """
  scalar JSON
  
  """
  Decimal scalar type - represents high-precision decimal numbers
  """
  scalar Decimal
`;