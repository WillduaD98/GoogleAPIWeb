import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row
} from 'react-bootstrap';
import { useMutation } from '@apollo/client';
import { ADD_BOOK } from '../utils/mutations.js';

import Auth from '../utils/auth';
import {  searchGoogleBooks } from '../utils/API';
import {  getSavedBookIds } from '../utils/localStorage';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  const [saveBookMutation] = useMutation(ADD_BOOK);

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  // useEffect(() => {
  //   return () => saveBookIds(savedBookIds);
  // });

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.infoLink || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId: string) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave: Book = searchedBooks.find((book) => book.bookId === bookId)!;
    if (!bookToSave) {
      return ('Not book to Save, error.')
    };

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const input = {
        bookId: bookToSave.bookId,
        title: bookToSave.title || 'Sin título',
        description: bookToSave.description || 'Sin descripción',
        authors: Array.isArray(bookToSave.authors) ? bookToSave.authors : [],
        image: bookToSave.image || '',
        link: bookToSave.link || ''
      };
      
      console.log('🚀 INPUT FINAL A GRAPHQL:', JSON.stringify(input, null, 2));
      console.log('🧾 QUERY:', ADD_BOOK.loc?.source.body);
      
      console.log('📚 bookToSave:', bookToSave);
      console.log('📤 Enviando a GraphQL:', {
        input: {
          bookId: bookToSave.bookId,
          authors: bookToSave.authors || [],
          description: bookToSave.description || '',
          image: bookToSave.image || '',
          link: bookToSave.link || '',
          title: bookToSave.title || ''
        }
      });
      const { data } = await saveBookMutation({
        variables: {
          input: {
            bookId: bookToSave.bookId,
            authors: bookToSave.authors || [],
            description: bookToSave.description || 'nothing',
            image: bookToSave.image || '',
            link: bookToSave.link || '',
            title: bookToSave.title || ''
          }
          
        }
      })

      if (!data?.addBook) {
        throw new Error('something went wrong!');
      }
      

      // if book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err: any) {
      if (err.graphQLErrors) {
        console.error('📛 GraphQL Errors:', err.graphQLErrors);
      }
      if (err.networkError) {
        console.error('🌐 Network Error:', err.networkError);
      }
      console.error('🧨 Error completo:', err);
    }
    
  };
  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)}
                        className='btn-block btn-info'
                        onClick={() => handleSaveBook(book.bookId)}>
                        {savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)
                          ? 'This book has already been saved!'
                          : 'Save this Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
