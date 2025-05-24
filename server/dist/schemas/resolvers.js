import { User } from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';
export const resolvers = {
    Query: {
        users: async () => {
            return await User.find();
        },
        user: async (_parent, args, context) => {
            const query = {
                $or: []
            };
            if (args.userId)
                query.$or.push({ _id: args.userId });
            if (args.username)
                query.$or.push({ username: args.username });
            if (context.user)
                query.$or.push({ _id: context.user._id });
            if (query.$or.length === 0) {
                throw new Error('Debes proporcionar un ID, username o estar autenticado.');
            }
            return await User.findOne(query);
        },
        me: async (_parent, _args, context) => {
            if (context.user) {
                return await User.findOne({ _id: context.user._id });
            }
            throw AuthenticationError;
        }
    },
    Mutation: {
        addUser: async (_parent, { input }) => {
            try {
                console.log(`Recibido input de backend: `, input);
                const user = await User.create({ ...input });
                const token = signToken(user.username, user.email, user._id);
                console.log('➡️ ADD_USER llamado con:', input);
                return { token, user };
            }
            catch (error) {
                console.error(`Error al crear usuario:`, error);
                throw new Error(`No se pudo crear el usuario`);
            }
        },
        login: async (_parent, { username, password }) => {
            const user = await User.findOne({ username });
            if (!user) {
                throw AuthenticationError;
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw AuthenticationError;
            }
            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },
        addBook: async (_parent, { input }, context) => {
            if (!context.user)
                throw new AuthenticationError('No autorizado');
            console.log('📥 Input recibido en resolver:', input);
            return await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: input } }, { new: true, runValidators: true });
        },
        removeBook: async (_parent, { book }, context) => {
            if (context.user) {
                return await User.findByIdAndUpdate({ _id: context.user._id }, { $pull: { savedBook: book.bookId } }, { new: true });
            }
            throw AuthenticationError;
        }
    }
};
