import { ddb } from '@arj/arj-common-utils/db';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { User } from '../../models/User.js';

const TABLE_NAME = process.env.USER_TABLE_NAME!;

export const userRepository = {
    async findById(userId: string): Promise<User | undefined> {
        const result = await ddb.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { userId },
            }),
        );
        return result.Item as User | undefined;
    },

    async findByEmail(email: string): Promise<User | undefined> {
        const result = await ddb.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email },
                Limit: 1,
            }),
        );
        return result.Items?.[0] as User | undefined;
    },

    async create(user: User): Promise<User> {
        await ddb.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: user,
                ConditionExpression: 'attribute_not_exists(userId)',
            }),
        );
        return user;
    },
};
