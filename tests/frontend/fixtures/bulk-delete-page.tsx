import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    BulkDeleteRow,
    BulkDeleteSelectAll,
    BulkDeleteTable,
} from '../../../resources/js/components/admin/bulk-delete-table';
import { PageContext, transport } from './bulk-delete-inertia';

let sequence = 0;
const root = createRoot(document.getElementById('root')!);
function Fixture({ options }: { options: any }) {
    const [ids, setIds] = useState<number[]>(options.ids ?? [1, 2, 3]);
    const [url, setUrl] = useState('/admin/test?page=1');
    const [visible, setVisible] = useState(true);
    transport.deleted = (path) =>
        setIds((rows) => rows.filter((id) => path !== `/admin/test/${id}`));
    (window as any).navigate = () => {
        window.dispatchEvent(
            new CustomEvent('test-inertia-before', {
                detail: { visit: { method: 'get' } },
            }),
        );
        setUrl('/admin/test?page=2');
        setIds([4, 5]);
    };
    (window as any).leave = () => setVisible(false);
    return (
        <PageContext.Provider value={{ component: 'admin/test', url }}>
            {visible && (
                <div className="overflow-x-auto">
                    <BulkDeleteTable
                        requireReason={options.reason}
                        className="w-full text-sm"
                    >
                        <thead>
                            <tr>
                                <BulkDeleteSelectAll />
                                <th>Nama</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ids.map((id) => (
                                <BulkDeleteRow
                                    key={id}
                                    deleteUrl={
                                        id === 99 ? null : `/admin/test/${id}`
                                    }
                                >
                                    <td>Data {id}</td>
                                    <td>Aktif</td>
                                </BulkDeleteRow>
                            ))}
                            {!ids.length && (
                                <tr>
                                    <td colSpan={3}>Tidak ada data</td>
                                </tr>
                            )}
                        </tbody>
                    </BulkDeleteTable>
                </div>
            )}
        </PageContext.Provider>
    );
}
(window as any).configure = (options = {}) => {
    transport.calls = [];
    transport.failure = options.failure ?? '';
    transport.failureMode = options.failureMode ?? 'validation';
    transport.delay = options.delay ?? 10;
    root.render(<Fixture key={++sequence} options={options} />);
};
(window as any).calls = () => transport.calls;
(window as any).configure();
