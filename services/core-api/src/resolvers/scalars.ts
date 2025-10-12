/**
 * GraphQL Custom Scalar Resolvers
 * 
 * Implements custom scalar types for UUID, DateTime, Date, JSON, and Decimal.
 */

import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql';

/**
 * UUID Scalar
 * Validates and serializes UUID strings
 */
const UUIDScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'A universally unique identifier (UUID) in string format',
  serialize(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError('UUID must be a string');
    }
    if (!isValidUUID(value)) {
      throw new GraphQLError(`Invalid UUID format: ${value}`);
    }
    return value;
  },
  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError('UUID must be a string');
    }
    if (!isValidUUID(value)) {
      throw new GraphQLError(`Invalid UUID format: ${value}`);
    }
    return value;
  },
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('UUID must be a string');
    }
    if (!isValidUUID(ast.value)) {
      throw new GraphQLError(`Invalid UUID format: ${ast.value}`);
    }
    return ast.value;
  },
});

/**
 * DateTime Scalar
 * ISO 8601 date-time string
 */
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 date-time string',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new GraphQLError('DateTime must be a Date object or ISO string');
  },
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new GraphQLError('DateTime must be a string');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new GraphQLError(`Invalid DateTime: ${value}`);
    }
    return date;
  },
  parseLiteral(ast): Date {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('DateTime must be a string');
    }
    const date = new Date(ast.value);
    if (isNaN(date.getTime())) {
      throw new GraphQLError(`Invalid DateTime: ${ast.value}`);
    }
    return date;
  },
});

/**
 * Date Scalar
 * ISO 8601 date string (YYYY-MM-DD)
 */
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 date string (YYYY-MM-DD)',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      return value.split('T')[0];
    }
    throw new GraphQLError('Date must be a Date object or ISO string');
  },
  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new GraphQLError('Date must be a string');
    }
    if (!isValidDate(value)) {
      throw new GraphQLError(`Invalid Date format: ${value}`);
    }
    return value;
  },
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('Date must be a string');
    }
    if (!isValidDate(ast.value)) {
      throw new GraphQLError(`Invalid Date format: ${ast.value}`);
    }
    return ast.value;
  },
});

/**
 * JSON Scalar
 * Arbitrary JSON data
 */
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON data',
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  parseLiteral(ast): unknown {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT:
        return parseObject(ast);
      case Kind.LIST:
        return ast.values.map((n) => JSONScalar.parseLiteral(n));
      case Kind.NULL:
        return null;
      default:
        throw new GraphQLError(`Invalid JSON value kind: ${ast.kind}`);
    }
  },
});

/**
 * Decimal Scalar
 * High-precision decimal numbers stored as strings
 */
const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'High-precision decimal number',
  serialize(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new GraphQLError('Decimal must be a number or string');
  },
  parseValue(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      if (!isValidDecimal(value)) {
        throw new GraphQLError(`Invalid Decimal: ${value}`);
      }
      return value;
    }
    throw new GraphQLError('Decimal must be a number or string');
  },
  parseLiteral(ast): string {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return ast.value;
    }
    if (ast.kind === Kind.STRING) {
      if (!isValidDecimal(ast.value)) {
        throw new GraphQLError(`Invalid Decimal: ${ast.value}`);
      }
      return ast.value;
    }
    throw new GraphQLError('Decimal must be a number or string');
  },
});

/**
 * Helper Functions
 */

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

function isValidDecimal(decimal: string): boolean {
  const decimalRegex = /^-?\d+(\.\d+)?$/;
  return decimalRegex.test(decimal);
}

function parseObject(ast: any): Record<string, unknown> {
  const value = Object.create(null);
  ast.fields.forEach((field: any) => {
    value[field.name.value] = JSONScalar.parseLiteral(field.value);
  });
  return value;
}

/**
 * Export scalar resolvers
 */
export const scalarResolvers = {
  UUID: UUIDScalar,
  DateTime: DateTimeScalar,
  Date: DateScalar,
  JSON: JSONScalar,
  Decimal: DecimalScalar,
};