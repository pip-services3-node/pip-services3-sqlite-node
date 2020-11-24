const process = require('process');
const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { SqliteConnection } from '../../src/persistence/SqliteConnection';
import { DummyPersistenceFixture } from '../fixtures/DummyPersistenceFixture';
import { DummySqlitePersistence } from './DummySqlitePersistence';

suite('DummySqliteConnection', ()=> {
    let connection: SqliteConnection;
    let persistence: DummySqlitePersistence;
    let fixture: DummyPersistenceFixture;

    let sqliteDatabase = process.env['SQLITE_DB'] || './data/test.db';
    if (sqliteDatabase == null)
        return;

    setup((done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.database', sqliteDatabase
        );

        connection = new SqliteConnection();
        connection.configure(dbConfig);

        persistence = new DummySqlitePersistence();
        persistence.setReferences(References.fromTuples(
            new Descriptor("pip-services", "connection", "sqlite", "default", "1.0"), connection
        ));

        fixture = new DummyPersistenceFixture(persistence);

        connection.open(null, (err: any) => {
            if (err) {
                done(err);
                return;
            }

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
    });

    teardown((done) => {
        connection.close(null, (err) => {
            persistence.close(null, done);
        });
    });

    test('Connection', (done) => {
        assert.isDefined(connection.getConnection());
        assert.isString(connection.getDatabaseName());

        done();
    });

    test('Crud Operations', (done) => {
        fixture.testCrudOperations(done);
    });

    test('Batch Operations', (done) => {
        fixture.testBatchOperations(done);
    });
});