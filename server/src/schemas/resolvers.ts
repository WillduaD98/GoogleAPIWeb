import { IBookDocument } from '../models/Book.js';
import { User }  from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';
// import { saveBook } from '../controllers/user-controller';

interface User {
    _id : string;
    username: string;
    email: string;
    password: string;
    savedBooks: IBookDocument[];
    bookCount: number;
}

interface GetUserArgs{ 
    userId?: string;
    username?: string
}

interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string
    }
}

interface AddBookArgs { 
    input: {
        authors?: string[],
        description?: string,
        bookId: string, 
        image?: string,
        link?: string,
        title: string
    }
}

interface RemoveBookArgs {
    book: {bookId: string}
}

interface Context {
    user?: User;
}

export const resolvers = {
    Query: {
        users: async(): Promise<User[]> => {
            return await User.find();
        },
        user: async (_parent: any, args: GetUserArgs, context: Context): Promise<User | null> => {
            const query: any = {
                $or: []
            }

            if (args.userId) query.$or.push({ _id: args.userId })
            if (args.username) query.$or.push({ username: args.username })
            if (context.user) query.$or.push({_id: context.user._id})

            if (query.$or.length === 0) {
                throw new Error('Debes proporcionar un ID, username o estar autenticado.');
            }

            return await User.findOne(query)
        },
        me: async (_parent: any, _args: any, context: Context): Promise<User | null> => {
            if (context.user) {
                return await User.findOne({ _id: context.user._id});
            }
            throw AuthenticationError;
        }
    },
    Mutation: {
        addUser: async (_parent: any, { input }:AddUserArgs): Promise<{ token: string; user: User}> => {
            try {
                console.log(`Recibido input de backend: ` ,input )
                const user = await User.create({ ...input });
                const token = signToken(user.username, user.email, user._id);
                console.log('➡️ ADD_USER llamado con:', input);

                return { token, user};
            } catch (error) {
                console.error(`Error al crear usuario:`, error)
                throw new Error(`No se pudo crear el usuario`)
            }
            
        },
        login: async (_parent: any, { username, password}: {
            username: string; password: string}): Promise<{
            token: string; user: User }> => {
                const user = await User.findOne({ username });
                if(!user) {
                    throw AuthenticationError;
                }
                const correctPw = await user.isCorrectPassword(password);
                if(!correctPw) {
                    throw AuthenticationError;
                }
                const token = signToken(user.username, user.email, user._id);
                return {token, user};
            },
            addBook: async (
                _parent: unknown,
                { input }: { input: AddBookArgs['input'] },
                context: Context
              ) => {
                if (!context.user) throw new AuthenticationError('No autorizado');
              
                console.log('📥 Input recibido en resolver:', input);
              
                return await User.findOneAndUpdate(
                  { _id: context.user._id },
                  { $addToSet: { savedBooks: input } },
                  { new: true, runValidators: true }
                );
              },
        removeBook: async (_parent: any, { book }:RemoveBookArgs, context: Context): Promise< User | null> => {
            if (context.user) {
                return await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    { $pull: { savedBook: book.bookId }},
                    { new: true }
                )
            }
            throw AuthenticationError;
        }
        }
    }
