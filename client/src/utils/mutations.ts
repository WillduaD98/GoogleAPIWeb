import { gql } from "@apollo/client";

export const ADD_USER =  gql`
    mutation addUser($input: UserInput!) {
        addUser(input: $input) {
            token
            user {
                _id
                username
            }
        }
    }
`

export const ADD_BOOK = gql `
    mutation addBook($input: BookInput!) {
        addBook(input: $input) {
            _id
            username
            savedBooks{
                authors
                description
                bookId
                image
                link
                title
            }
        }
    }
`

export const LOGIN_USER = gql`
    mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            token
            user {
                _id
                username
            }
        }
    }
`

export const REMOVE_BOOK = gql`
    mutation removeBook($bookId: String! ) {
        removeBook(bookId: $bookId) {
            _id
            username
            savedBooks{
                bookId
            }
        }
    }
`