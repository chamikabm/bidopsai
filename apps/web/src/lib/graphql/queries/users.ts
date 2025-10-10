/**
 * User GraphQL Queries
 */

export const GET_USERS = `
  query GetUsers($limit: Int, $offset: Int, $search: String) {
    users(limit: $limit, offset: $offset, search: $search) {
      id
      cognitoUserId
      email
      firstName
      lastName
      profileImageUrl
      status
      createdAt
      roles {
        id
        name
        description
      }
    }
  }
`;

export const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      cognitoUserId
      email
      firstName
      lastName
      profileImageUrl
      status
      createdAt
      updatedAt
      roles {
        id
        name
        description
      }
      projects {
        id
        project {
          id
          name
          status
          deadline
        }
        role
      }
    }
  }
`;

export const GET_CURRENT_USER = `
  query GetCurrentUser {
    currentUser {
      id
      cognitoUserId
      email
      firstName
      lastName
      profileImageUrl
      status
      roles {
        id
        name
        description
      }
    }
  }
`;
