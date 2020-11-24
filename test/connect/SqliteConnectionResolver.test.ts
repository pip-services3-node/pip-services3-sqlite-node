const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { SqliteConnectionResolver } from '../../src/connect/SqliteConnectionResolver';

suite('SqliteConnectionResolver', ()=> {

    test('Connection Config with Params', (done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.database', './data/test.db'
        );

        let resolver = new SqliteConnectionResolver();
        resolver.configure(dbConfig);

        resolver.resolve(null, (err, config) => {
            assert.isNull(err);

            assert.isObject(config);
            assert.equal('./data/test.db', config.database);

            done(err);
        });
    });

    test('Connection Config with URI', (done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.uri', 'file://./data/test.db'
        );

        let resolver = new SqliteConnectionResolver();
        resolver.configure(dbConfig);

        resolver.resolve(null, (err, config) => {
            assert.isNull(err);

            assert.isObject(config);
            assert.equal('./data/test.db', config.database);

            done(err);
        });
    });
});