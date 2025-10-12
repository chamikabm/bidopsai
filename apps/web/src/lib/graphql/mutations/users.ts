import { gql } from 'graphql-request';

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      username
      firstName
      lastName
      profileImageUrl
      preferredLanguage
      themePreference
      emailVerified
      createdAt
      updatedAt
      cognitoUserId
      roles {
        id
        name
        description
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: UUID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      username
      firstName
      lastName
      profileImageUrl
      preferredLanguage
      themePreference
      emailVerified
      createdAt
      updatedAt
      lastLogin
      cognitoUserId
      roles {
        id
        name
        description
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: UUID!) {
    deleteUser(id: $id)
  }
`;

export const ASSIGN_ROLE = gql`
  mutation AssignRole($userId: UUID!, $roleId: UUID!) {
    assignRole(userId: $userId, roleId: $roleId) {
      id
      userId
      roleId
      assignedAt
      assignedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

export const REMOVE_ROLE = gql`
  mutation RemoveRole($userId: UUID!, $roleId: UUID!) {
    removeRole(userId: $userId, roleId: $roleId)
  }
`;

export const UPDATE_MY_PROFILE = gql`
  mutation UpdateMyProfile($input: UpdateUserInput!) {
    updateMyProfile(input: $input) {
      id
      email
      username
      firstName
      lastName
      profileImageUrl
      preferredLanguage
      themePreference
      emailVerified
      createdAt
      updatedAt
      lastLogin
      roles {
        id
        name
        description
      }
    }
  }
`;