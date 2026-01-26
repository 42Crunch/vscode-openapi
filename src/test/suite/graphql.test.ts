import assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import { GraphQlHandler } from "../../graphql/handler";
import { parse } from "graphql";
import { wrap } from "../utils";

suite("GraphQL locations", () => {
  test("File A", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/graphql/a.graphql"), {
      encoding: "utf8",
    });
    const ast = parse(wrap(text));
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.Tweet(id: ID!)", [636, 638]],
      ["Query.User(id: ID!)", [765, 767]],
      ["Mutation.deleteTweet(id: ID!)", [941, 943]],
      ["Mutation.markTweetRead(id: ID!)", [975, 977]],
      ["Query.Notifications(limit: Int)", [801, 804]],
      ["Mutation.createTweet(body: String)", [901, 907]],
      ["Query.TweetsMeta().Meta.count: Int", [578, 581]],
      ["Query.NotificationsMeta().Meta.count: Int", [578, 581]],
      ["Query.Tweets(): [Tweet]", [724, 729]],
      ["Query.Notifications(): [Notification]", [808, 820]],
      ["Query.Tweets(limit: Int)", [666, 669]],
      ["Query.Tweets(skip: Int)", [677, 680]],
      ["Query.Tweets(sort_field: String)", [694, 700]],
      ["Query.Tweets(sort_order: String)", [714, 720]],
      ["Query", [614, 619]],
      ["Mutation", [858, 866]],
      ["Query.Tweet().Tweet.id: ID!", [21, 23]],
      ["Mutation.createTweet().Tweet.id: ID!", [21, 23]],
      ["Mutation.deleteTweet().Tweet.id: ID!", [21, 23]],
      ["Query.Tweet().Tweet.body: String", [86, 92]],
      ["Mutation.createTweet().Tweet.body: String", [86, 92]],
      ["Mutation.deleteTweet().Tweet.body: String", [86, 92]],
      ["Query.Tweet().Tweet.date: Date", [138, 142]],
      ["Mutation.createTweet().Tweet.date: Date", [138, 142]],
      ["Mutation.deleteTweet().Tweet.date: Date", [138, 142]],
      ["Query.User().User.id: ID!", [263, 265]],
      ["Query.User().User.username: String", [281, 287]],
      ["Query.User().User.first_name: String", [304, 310]],
      ["Query.User().User.last_name: String", [326, 332]],
      ["Query.User().User.full_name: String", [348, 354]],
      ["Query.User().User.name: String", [365, 371]],
      ["Query.User().User.avatar_url: Url", [400, 403]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.views: Int", [430, 433]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.likes: Int", [445, 448]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.retweets: Int", [463, 466]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.responses: Int", [482, 485]],
      ["Query.Tweet().Tweet.Author.User.id: ID!", [263, 265]],
      ["Mutation.createTweet().Tweet.Author.User.id: ID!", [263, 265]],
      ["Mutation.deleteTweet().Tweet.Author.User.id: ID!", [263, 265]],
      ["Query.Tweet().Tweet.Author.User.username: String", [281, 287]],
      ["Query.Tweet().Tweet.Author.User.first_name: String", [304, 310]],
      ["Query.Tweet().Tweet.Author.User.last_name: String", [326, 332]],
      ["Query.Tweet().Tweet.Author.User.full_name: String", [348, 354]],
      ["Query.Tweet().Tweet.Author.User.name: String", [365, 371]],
      ["Mutation.createTweet().Tweet.Author.User.username: String", [281, 287]],
      ["Mutation.createTweet().Tweet.Author.User.first_name: String", [304, 310]],
      ["Mutation.createTweet().Tweet.Author.User.last_name: String", [326, 332]],
      ["Mutation.createTweet().Tweet.Author.User.full_name: String", [348, 354]],
      ["Mutation.createTweet().Tweet.Author.User.name: String", [365, 371]],
      ["Mutation.deleteTweet().Tweet.Author.User.username: String", [281, 287]],
      ["Mutation.deleteTweet().Tweet.Author.User.first_name: String", [304, 310]],
      ["Mutation.deleteTweet().Tweet.Author.User.last_name: String", [326, 332]],
      ["Mutation.deleteTweet().Tweet.Author.User.full_name: String", [348, 354]],
      ["Mutation.deleteTweet().Tweet.Author.User.name: String", [365, 371]],
      ["Query.Tweet().Tweet.Author.User.avatar_url: Url", [400, 403]],
      ["Mutation.createTweet().Tweet.Author.User.avatar_url: Url", [400, 403]],
      ["Mutation.deleteTweet().Tweet.Author.User.avatar_url: Url", [400, 403]],
      ["Query.Tweets()[0].Tweet.id: ID!", [21, 23]],
      ["Query.Tweets()[0].Tweet.Author.User.id: ID!", [263, 265]],
      ["Query.Notifications()[0].Notification.id: ID", [517, 519]],
      ["Query.Tweets()[0].Tweet.body: String", [86, 92]],
      ["Query.Tweets()[0].Tweet.Author.User.username: String", [281, 287]],
      ["Query.Tweets()[0].Tweet.Author.User.first_name: String", [304, 310]],
      ["Query.Tweets()[0].Tweet.Author.User.last_name: String", [326, 332]],
      ["Query.Tweets()[0].Tweet.Author.User.full_name: String", [348, 354]],
      ["Query.Tweets()[0].Tweet.Author.User.name: String", [365, 371]],
      ["Query.Notifications()[0].Notification.type: String", [545, 551]],
      ["Query.Tweets()[0].Tweet.date: Date", [138, 142]],
      ["Query.Tweets()[0].Tweet.Author.User.avatar_url: Url", [400, 403]],
      ["Query.Notifications()[0].Notification.date: Date", [530, 534]],
      ["Query.Tweet().Tweet.Stats.Stat.views: Int", [430, 433]],
      ["Query.Tweet().Tweet.Stats.Stat.likes: Int", [445, 448]],
      ["Query.Tweet().Tweet.Stats.Stat.retweets: Int", [463, 466]],
      ["Query.Tweet().Tweet.Stats.Stat.responses: Int", [482, 485]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.views: Int", [430, 433]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.likes: Int", [445, 448]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.retweets: Int", [463, 466]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.responses: Int", [482, 485]],
      ["Mutation.createTweet().Tweet.Stats.Stat.views: Int", [430, 433]],
      ["Mutation.createTweet().Tweet.Stats.Stat.likes: Int", [445, 448]],
      ["Mutation.createTweet().Tweet.Stats.Stat.retweets: Int", [463, 466]],
      ["Mutation.createTweet().Tweet.Stats.Stat.responses: Int", [482, 485]],
    ];
    for (const exp of expected) {
      const pos = handler.getPosition(exp[0]);
      assert.strictEqual(exp[1][0], pos.start);
      assert.strictEqual(exp[1][1], pos.end);
    }
  });

  test("File B", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/graphql/b.graphql"), {
      encoding: "utf8",
    });
    const ast = parse(wrap(text));
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.viewerApiKey(apiKey: String!)", [161, 167]],
      ["Query.viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)", [303, 319]],
      ["Mutation.mutationViewerApiKey(apiKey: String!)", [2591, 2597]],
      ["Mutation.mutationViewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)", [2749, 2765]],
      [
        "Mutation.mutationViewerApiKey().MutationViewerApiKey.edituserinfo.ApiUserEditInfo.message: String!",
        [3354, 3360],
      ],
      [
        "Mutation.mutationViewerAnyAuth().MutationViewerAnyAuth.edituserinfo.ApiUserEditInfo.message: String!",
        [3354, 3360],
      ],
      ["Mutation.authenticate().ApiLogin.message: String!", [2820, 2826]],
      ["Mutation.register().ApiRegister.message: String", [3006, 3012]],
      ["Mutation.register().ApiRegister.token: String", [3022, 3028]],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.name: String!)",
        [2189, 2214],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.pass: String!)",
        [2189, 2214],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.user: String!)",
        [2189, 2214],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.name: String!)",
        [2393, 2418],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.pass: String!)",
        [2393, 2418],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.user: String!)",
        [2393, 2418],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.accountBalance: Int!)",
        [2189, 2214],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.accountBalance: Int!)",
        [2393, 2418],
      ],
      ["Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers: [UsersListItem]", [565, 578]],
      ["Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch: [UsersItem]", [779, 788]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers: [UsersListItem]", [1485, 1498]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch: [UsersItem]", [1699, 1708]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiUserInfo: [UsersItem]", [1889, 1898]],
      ["Mutation.authenticate().ApiLogin.token: String!", [2837, 2843]],
      ["Query", [5, 10]],
      ["Mutation", [2020, 2028]],
      ["Query.viewerApiKey().ViewerApiKey.apiUserInfo: [UsersItem]", [969, 978]],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.accountBalance: Float",
        [1048, 1053],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.accountBalance: Float",
        [1150, 1155],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.accountBalance: Float",
        [1048, 1053],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.accountBalance: Float",
        [1150, 1155],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.name: String!",
        [1062, 1068],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.user: String!",
        [1078, 1084],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.name: String",
        [1201, 1207],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.pass: String!",
        [1216, 1222],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.user: String!",
        [1232, 1238],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.name: String!",
        [1062, 1068],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.user: String!",
        [1078, 1084],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.name: String",
        [1201, 1207],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.pass: String!",
        [1216, 1222],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.user: String!",
        [1232, 1238],
      ],
    ];
    for (const exp of expected) {
      const pos = handler.getPosition(exp[0]);
      assert.strictEqual(exp[1][0], pos.start);
      assert.strictEqual(exp[1][1], pos.end);
    }
  });

  test("File C", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/graphql/c.graphql"), {
      encoding: "utf8",
    });
    const ast = parse(wrap(text));
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.users(first: Int)", [267, 270]],
      ["Query.users(): [User]", [274, 278]],
      ["Query.users().nonExistentArg: nonExistentArg", [309, 325]],
      ["Query.users()[0].User.name: String", [373, 379]],
    ];
    for (const exp of expected) {
      const pos = handler.getPosition(exp[0]);
      assert.strictEqual(exp[1][0], pos.start);
      assert.strictEqual(exp[1][1], pos.end);
    }
  });
});
