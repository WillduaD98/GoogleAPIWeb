// import { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

// import { getMe, deleteBook } from '../utils/API';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
// import type { User } from '../models/User.js';
import { useQuery } from '@apollo/client';

import { QUERY_ME } from '../utils/queries.js';
import { REMOVE_BOOK } from '../utils/mutations.js';
import { Book } from '../models/Book.js';
import { useMutation } from '@apollo/client';

const SavedBooks = () => {
  const { loading, error, data } =  useQuery(QUERY_ME);
  const userData = data?.me;

  const [removeBookMutation] = useMutation(REMOVE_BOOK)
  
  const handleDeleteBook = async (bookId: string) => {
    if (!Auth.loggedIn()) return false;

    try {
      await removeBookMutation({
        variables: {bookId},
        update(cache, {data}) {
          cache.writeQuery({
            query: QUERY_ME,
            data: { me: data.removeBook}
          });
        },
      });

      removeBookId(bookId);
    } catch (error) {
      console.error(`Error trying to delete book`, error)
    }
  }

  if(loading) return <p>Loading saved books...</p>
  if(error) return <p> {error.message}</p>

  // use this to determine if `useEffect()` hook needs to run again

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks.map((book: Book) => (
              <Col md='4' key={book.bookId} >
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant='top'
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className='btn-block btn-danger'
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
      
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
