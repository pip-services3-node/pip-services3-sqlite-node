let process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';
import { DummyPersistenceFixture } from '../fixtures/DummyPersistenceFixture';
import { DummySqlitePersistence } from './DummySqlitePersistence';

suite('DummySqlitePersistence', ()=> {
    let persistence: DummySqlitePersistence;
    let fixture: DummyPersistenceFixture;

    let sqliteDatabase = process.env['SQLITE_DB'] || './data/test.db';
    if (sqliteDatabase == null)
        return;

    setup((done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.database', sqliteDatabase
        );

        persistence = new DummySqlitePersistence();
        persistence.configure(dbConfig);

        fixture = new DummyPersistenceFixture(persistence);

        persistence.open(null, (err: any) => {
            if (err) {
                done(err);
                return;
            }

            persistence.clear(null, (err) => {
                done(err);
            });
        });
    });

    teardown((done) => {
        persistence.close(null, done);
    });

    test('Crud Operations', (done) => {
        fixture.testCrudOperations(done);
    });

    test('Batch Operations', (done) => {
        fixture.testBatchOperations(done);
    });
});