import assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import { GraphQlHandler } from "../../graphql/handler";
import { parse } from "graphql";

suite("GraphQL locations", () => {
  test("File A", () => {
    const text = readFileSync(resolve(__dirname, "../../../tests/graphql/a.graphql"), {
      encoding: "utf8",
    });
    const ast = parse(text);
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.Tweet(id: ID!)", [679, 681]],
      ["Query.User(id: ID!)", [811, 813]],
      ["Mutation.deleteTweet(id: ID!)", [996, 998]],
      ["Mutation.markTweetRead(id: ID!)", [1031, 1033]],
      ["Query.Notifications(limit: Int)", [848, 851]],
      ["Mutation.createTweet(body: String)", [954, 960]],
      ["Query.TweetsMeta().Meta.count: Int", [614, 617]],
      ["Query.NotificationsMeta().Meta.count: Int", [614, 617]],
      ["Query.Tweets(): [Tweet]", [768, 773]],
      ["Query.Notifications(): [Notification]", [855, 867]],
      ["Query.Tweets(limit: Int)", [710, 713]],
      ["Query.Tweets(skip: Int)", [721, 724]],
      ["Query.Tweets(sort_field: String)", [738, 744]],
      ["Query.Tweets(sort_order: String)", [758, 764]],
      ["Query", [656, 661]],
      ["Mutation", [909, 917]],
      ["Query.Tweet().Tweet.id: ID!", [22, 24]],
      ["Mutation.createTweet().Tweet.id: ID!", [22, 24]],
      ["Mutation.deleteTweet().Tweet.id: ID!", [22, 24]],
      ["Query.Tweet().Tweet.body: String", [89, 95]],
      ["Mutation.createTweet().Tweet.body: String", [89, 95]],
      ["Mutation.deleteTweet().Tweet.body: String", [89, 95]],
      ["Query.Tweet().Tweet.date: Date", [143, 147]],
      ["Mutation.createTweet().Tweet.date: Date", [143, 147]],
      ["Mutation.deleteTweet().Tweet.date: Date", [143, 147]],
      ["Query.User().User.id: ID!", [276, 278]],
      ["Query.User().User.username: String", [295, 301]],
      ["Query.User().User.first_name: String", [319, 325]],
      ["Query.User().User.last_name: String", [342, 348]],
      ["Query.User().User.full_name: String", [365, 371]],
      ["Query.User().User.name: String", [383, 389]],
      ["Query.User().User.avatar_url: Url", [419, 422]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.views: Int", [453, 456]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.likes: Int", [469, 472]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.retweets: Int", [488, 491]],
      ["Mutation.deleteTweet().Tweet.Stats.Stat.responses: Int", [508, 511]],
      ["Query.Tweet().Tweet.Author.User.id: ID!", [276, 278]],
      ["Mutation.createTweet().Tweet.Author.User.id: ID!", [276, 278]],
      ["Mutation.deleteTweet().Tweet.Author.User.id: ID!", [276, 278]],
      ["Query.Tweet().Tweet.Author.User.username: String", [295, 301]],
      ["Query.Tweet().Tweet.Author.User.first_name: String", [319, 325]],
      ["Query.Tweet().Tweet.Author.User.last_name: String", [342, 348]],
      ["Query.Tweet().Tweet.Author.User.full_name: String", [365, 371]],
      ["Query.Tweet().Tweet.Author.User.name: String", [383, 389]],
      ["Mutation.createTweet().Tweet.Author.User.username: String", [295, 301]],
      ["Mutation.createTweet().Tweet.Author.User.first_name: String", [319, 325]],
      ["Mutation.createTweet().Tweet.Author.User.last_name: String", [342, 348]],
      ["Mutation.createTweet().Tweet.Author.User.full_name: String", [365, 371]],
      ["Mutation.createTweet().Tweet.Author.User.name: String", [383, 389]],
      ["Mutation.deleteTweet().Tweet.Author.User.username: String", [295, 301]],
      ["Mutation.deleteTweet().Tweet.Author.User.first_name: String", [319, 325]],
      ["Mutation.deleteTweet().Tweet.Author.User.last_name: String", [342, 348]],
      ["Mutation.deleteTweet().Tweet.Author.User.full_name: String", [365, 371]],
      ["Mutation.deleteTweet().Tweet.Author.User.name: String", [383, 389]],
      ["Query.Tweet().Tweet.Author.User.avatar_url: Url", [419, 422]],
      ["Mutation.createTweet().Tweet.Author.User.avatar_url: Url", [419, 422]],
      ["Mutation.deleteTweet().Tweet.Author.User.avatar_url: Url", [419, 422]],
      ["Query.Tweets()[0].Tweet.id: ID!", [22, 24]],
      ["Query.Tweets()[0].Tweet.Author.User.id: ID!", [276, 278]],
      ["Query.Notifications()[0].Notification.id: ID", [547, 549]],
      ["Query.Tweets()[0].Tweet.body: String", [89, 95]],
      ["Query.Tweets()[0].Tweet.Author.User.username: String", [295, 301]],
      ["Query.Tweets()[0].Tweet.Author.User.first_name: String", [319, 325]],
      ["Query.Tweets()[0].Tweet.Author.User.last_name: String", [342, 348]],
      ["Query.Tweets()[0].Tweet.Author.User.full_name: String", [365, 371]],
      ["Query.Tweets()[0].Tweet.Author.User.name: String", [383, 389]],
      ["Query.Notifications()[0].Notification.type: String", [577, 583]],
      ["Query.Tweets()[0].Tweet.date: Date", [143, 147]],
      ["Query.Tweets()[0].Tweet.Author.User.avatar_url: Url", [419, 422]],
      ["Query.Notifications()[0].Notification.date: Date", [561, 565]],
      ["Query.Tweet().Tweet.Stats.Stat.views: Int", [453, 456]],
      ["Query.Tweet().Tweet.Stats.Stat.likes: Int", [469, 472]],
      ["Query.Tweet().Tweet.Stats.Stat.retweets: Int", [488, 491]],
      ["Query.Tweet().Tweet.Stats.Stat.responses: Int", [508, 511]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.views: Int", [453, 456]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.likes: Int", [469, 472]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.retweets: Int", [488, 491]],
      ["Query.Tweets()[0].Tweet.Stats.Stat.responses: Int", [508, 511]],
      ["Mutation.createTweet().Tweet.Stats.Stat.views: Int", [453, 456]],
      ["Mutation.createTweet().Tweet.Stats.Stat.likes: Int", [469, 472]],
      ["Mutation.createTweet().Tweet.Stats.Stat.retweets: Int", [488, 491]],
      ["Mutation.createTweet().Tweet.Stats.Stat.responses: Int", [508, 511]],
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
    const ast = parse(text);
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.viewerApiKey(apiKey: String!)", [165, 171]],
      ["Query.viewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)", [312, 328]],
      ["Mutation.mutationViewerApiKey(apiKey: String!)", [2706, 2712]],
      ["Mutation.mutationViewerAnyAuth(accessToken.AccessTokenInput.apiKey: String)", [2869, 2885]],
      [
        "Mutation.mutationViewerApiKey().MutationViewerApiKey.edituserinfo.ApiUserEditInfo.message: String!",
        [3506, 3512],
      ],
      [
        "Mutation.mutationViewerAnyAuth().MutationViewerAnyAuth.edituserinfo.ApiUserEditInfo.message: String!",
        [3506, 3512],
      ],
      ["Mutation.authenticate().ApiLogin.message: String!", [2944, 2950]],
      ["Mutation.register().ApiRegister.message: String", [3143, 3149]],
      ["Mutation.register().ApiRegister.token: String", [3160, 3166]],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.name: String!)",
        [2292, 2317],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.pass: String!)",
        [2292, 2317],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.user: String!)",
        [2292, 2317],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.name: String!)",
        [2503, 2528],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.pass: String!)",
        [2503, 2528],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.user: String!)",
        [2503, 2528],
      ],
      [
        "Mutation.authenticate(userRegistrationDataInput.UserRegistrationDataInput.accountBalance: Int!)",
        [2292, 2317],
      ],
      [
        "Mutation.register(userRegistrationDataInput.UserRegistrationDataInput.accountBalance: Int!)",
        [2503, 2528],
      ],
      ["Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers: [UsersListItem]", [584, 597]],
      ["Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch: [UsersItem]", [809, 818]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers: [UsersListItem]", [1553, 1566]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch: [UsersItem]", [1778, 1787]],
      ["Query.viewerAnyAuth().ViewerAnyAuth.apiUserInfo: [UsersItem]", [1978, 1987]],
      ["Mutation.authenticate().ApiLogin.token: String!", [2962, 2968]],
      ["Query", [5, 10]],
      ["Mutation", [2117, 2125]],
      ["Query.viewerApiKey().ViewerApiKey.apiUserInfo: [UsersItem]", [1009, 1018]],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.accountBalance: Float",
        [1093, 1098],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.accountBalance: Float",
        [1202, 1207],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.accountBalance: Float",
        [1093, 1098],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.accountBalance: Float",
        [1202, 1207],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.name: String!",
        [1108, 1114],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminAllUsers[0].UsersListItem.user: String!",
        [1125, 1131],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.name: String",
        [1257, 1263],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.pass: String!",
        [1273, 1279],
      ],
      [
        "Query.viewerApiKey().ViewerApiKey.apiAdminUsersSearch[0].UsersItem.user: String!",
        [1290, 1296],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.name: String!",
        [1108, 1114],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminAllUsers[0].UsersListItem.user: String!",
        [1125, 1131],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.name: String",
        [1257, 1263],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.pass: String!",
        [1273, 1279],
      ],
      [
        "Query.viewerAnyAuth().ViewerAnyAuth.apiAdminUsersSearch[0].UsersItem.user: String!",
        [1290, 1296],
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
    const ast = parse(text);
    const handler = new GraphQlHandler(ast);
    const expected: [string, number[]][] = [
      ["Query.users(first: Int)", [276, 279]],
      ["Query.users(): [User]", [283, 287]],
      ["Query.users().nonExistentArg: nonExistentArg", [318, 334]],
      ["Query.users()[0].User.name: String", [386, 392]],
    ];
    for (const exp of expected) {
      const pos = handler.getPosition(exp[0]);
      assert.strictEqual(exp[1][0], pos.start);
      assert.strictEqual(exp[1][1], pos.end);
    }
  });
});
