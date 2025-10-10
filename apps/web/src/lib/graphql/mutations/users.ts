/**
 * User GraphQL Mutations
 */

export const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      cognitoUserId
      email
      firstName
      lastName
      status
      createdAt
    }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      firstName
      lastName
      profileImageUrl
      status
      updatedAt
    }
  }
`;

export const DELETE_USER = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

export const ASSIGN_USER_ROLE = `
  mutation AssignUserRole($userId: ID!, $roleId: ID!) {
    assignUserRole(userId: $userId, roleId: $roleId) {
      id
      user {
        id
        email
      }
      role {
        id
        name
      }
    }
  }
`;

export const REMOVE_USER_ROLE = `
  mutation RemoveUserRole($userId: ID!, $roleId: ID!) {
    removeUserRole(userId: $userId, roleId: $roleId) {
      success
      message
    }
  }
`;
