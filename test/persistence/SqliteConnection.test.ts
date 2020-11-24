const assert = require('chai').assert;
const process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';
import { SqliteConnection } from '../../src/persistence/SqliteConnection';

suite('SqliteConnection', ()=> {
    let connection: SqliteConnection;

    let sqliteDatabase = process.env['SQLITE_DB'] || './data/test.db';
    if (sqliteDatabase == null)
        return;

    setup((done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.database', sqliteDatabase
        );

        connection = new SqliteConnection();
        connection.configure(dbConfig);

        connection.open(null, done);
    });

    teardown((done) => {
        connection.close(null, done);
    });

    test('Open and Close', (done) => {
        assert.isDefined(connection.getConnection());
        assert.isString(connection.getDatabaseName());

        done();
    });
});