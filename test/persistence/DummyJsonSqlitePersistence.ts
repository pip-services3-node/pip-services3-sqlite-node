import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';

import { IdentifiableJsonSqlitePersistence } from '../../src/persistence/IdentifiableJsonSqlitePersistence';
import { Dummy } from '../fixtures/Dummy';
import { IDummyPersistence } from '../fixtures/IDummyPersistence';

export class DummyJsonSqlitePersistence 
    extends IdentifiableJsonSqlitePersistence<Dummy, string> 
    implements IDummyPersistence
{
    public constructor() {
        super('dummies_json');
    }

    protected defineSchema(): void {
        this.clearSchema();
        this.ensureTable();
        this.ensureSchema("CREATE UNIQUE INDEX IF NOT EXISTS \"" + this._tableName + "_json_key\" ON dummies_json (JSON_EXTRACT(data, '$.key'))");
    }

    public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, 
        callback: (err: any, page: DataPage<Dummy>) => void): void {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = "";
        if (key != null)
            filterCondition += "JSON_EXTRACT(data, '$.key')='" + key + "'";

        super.getPageByFilter(correlationId, filterCondition, paging, null, null, callback);
    }

    public getCountByFilter(correlationId: string, filter: FilterParams, 
        callback: (err: any, count: number) => void): void {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = "";
        if (key != null)
            filterCondition += "JSON_EXTRACT(data, '$.key')='" + key + "'";

        super.getCountByFilter(correlationId, filterCondition, callback);
    }
}