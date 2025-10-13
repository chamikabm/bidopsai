/**
 * GraphQL Schema - Main Export
 * 
 * Aggregates all type definitions and exports them for Apollo Server.
 */

import { scalarTypeDefs } from './scalars';
import { enumTypeDefs } from './enums';
import { typeTypeDefs } from './types';
import { inputTypeDefs } from './inputs';
import { queryTypeDefs } from './queries';
import { mutationTypeDefs } from './mutations';
import { subscriptionTypeDefs } from './subscriptions';

/**
 * Combined type definitions
 * Order matters: scalars, enums, types, inputs, queries, mutations, subscriptions
 */
export const typeDefs = [
  scalarTypeDefs,
  enumTypeDefs,
  typeTypeDefs,
  inputTypeDefs,
  queryTypeDefs,
  mutationTypeDefs,
  subscriptionTypeDefs,
];