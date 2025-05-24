export const typeDefs = `
    type User {
        _id: ID
        username: String
        email: String
        password: String
        savedBooks: [BookDocument]!
    }

    type Auth {
        token: ID!
        user: User
    }

    type BookDocument {
        bookId: String!
        title: String!
        authors: [String]
        description: String!
        image: String
        link: String
    }

    input UserInput {
        username: String!
        email: String!
        password: String!
    }

    input BookInput {
        authors: [String]
        description: String!
        bookId: String!
        image: String
        link: String
        title: String!
      }
      
    type Query {
        users: [User]!
        user(userId: ID!, username: String): User
        me: User
    }

    type Mutation {
        addUser(input: UserInput!): Auth
        login(username: String!, password: String!): Auth
        addBook(input: BookInput!): User
        removeBook(bookId: String!): User
    }

`;
