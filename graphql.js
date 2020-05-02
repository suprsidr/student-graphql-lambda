const { ApolloServer, gql } = require('apollo-server-lambda')
const uuid = require('uuid');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const ItemProvider = require("./itemprovider-mongodb").ItemProvider
const itemProvider = new ItemProvider()

const typeDefs = gql`
scalar Date

type Query {
  student(sid: ID): Student
  allStudents: [Student]
  search(field: String, query: String, sort: String, direction: Int): [Student]
}
type Mutation {
  addStudent(input: StudentInput): Student
  updateStudent(input: StudentInput): Student
  deleteStudent(input: DeleteInput): DeleteResponse
}
type DeleteResponse {
  ok: Boolean
  deletedCount: Int
}
input DeleteInput {
  sid: ID
}
input StudentInput {
  name: NameInput
  dob: Date
  picture: PictureInput
  location: LocationInput
  phone: String
  cell: String
  email: String
  major: String
  gpa: String
  registered: Date
  sid: ID
  modified: Date
  modifiedby: String
}
input NameInput {
  first: String
  last: String
}
input PictureInput {
  large: String
}
input LocationInput {
  street: String
  city: String
  state: String
  postcode: String
}
type Student {
  name: Name
  dob: Date
  picture: Picture
  location: Location
  phone: String
  cell: String
  email: String
  registered: Date
  major: String
  gpa: String
  sid: ID!
  modified: Date
  modifiedby: String
}
type Name {
  first: String
  last: String
}
type Picture {
  large: String
}
type Location {
  street: String
  city: String
  state: String
  postcode: String
}
`;

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value; // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value) // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    student(_, { sid }, context, info) {
      return itemProvider.findOne({
        collection: "students",
        query: { sid: sid },
        limit: 0,
        sort: {},
        fields: {}
      })
    },
    allStudents() {
      return itemProvider.findItems(
        {
          collection: "students",
          query: {},
          limit: 0,
          sort: {},
          fields: {}
        })
    },
    search(_, { field, query, sort, direction = 1 }) {
      return itemProvider.findItems(
        {
          collection: "students",
          query: { [field]: { $regex: query } },
          limit: 0,
          sort: { [sort]: direction },
          fields: {}
        })
    }
  },
  Mutation: {
    addStudent(_, { input: student }) {
      student.sid = uuid.v4()
      student.modified = student.registered = Date.now()
      student.dob = new Date(student.dob)
      return itemProvider.saveItem({
        collection: 'students',
        student
      })
    },
    updateStudent(_, { input: student }) {
      student.modified = Date.now()
      return itemProvider.updateItem({
        collection: 'students',
        query: { sid: student.sid },
        action: { $set: student }
      })
    },
    deleteStudent(_, { input: { sid } }) {
      return itemProvider.deleteItem({
        collection: 'students',
        query: { sid: sid }
      })
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers });

exports.graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
  }
});
