
import { useState, useEffect, useMemo, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Database,
    Table as TableIcon,
    BarChart3,
    PieChart as PieChartIcon,
    Search,
    Download,
    Filter,
    LayoutGrid
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const AnalyticsDashboard = () => {
    const { t } = useContext(LanguageContext);
    const [datasets, setDatasets] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // Add error state
    const [stats, setStats] = useState({}); // Column stats: { colName: { type, unique, top, hist } }

    // View State
    const [viewMode, setViewMode] = useState('chart'); // 'table' | 'chart'
    const [chartConfig, setChartConfig] = useState({
        type: 'bar', // 'bar' | 'pie'
        xAxis: '', // Group By (Category)
        yAxis: '', // Metric (Numeric) or 'count'
    });

    // Fetch list of datasets on mount
    useEffect(() => {
        fetch(`${API_URL}/analytics/datasets`)
            .then(res => {
                if (!res.ok) throw new Error(`Dataset list failed: ${res.status}`);
                return res.json();
            })
            .then(list => {
                setDatasets(list);
                if (list.length > 0) setSelectedFileId(list[0].id);
            })
            .catch(err => {
                console.error("Failed to load datasets", err);
                setError(err.message);
            });
    }, []);

    // Fetch data when file ID changes
    useEffect(() => {
        if (!selectedFileId) return;

        setLoading(true);
        setError(null);

        // Ensure ID is encoded correctly just in case
        const safeId = encodeURIComponent(selectedFileId);

        fetch(`http://localhost:8000/analytics/data/${selectedFileId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Data fetch failed: ${res.status} ${res.statusText}`);
                return res.json();
            })
            .then(json => {
                if (Array.isArray(json)) {
                    setData(json);
                    const newStats = calculateStats(json);
                    setStats(newStats);

                    if (Object.keys(newStats).length > 0) {
                        const catCols = Object.keys(newStats).filter(k => newStats[k].type === 'categorical');
                        const numCols = Object.keys(newStats).filter(k => newStats[k].type === 'numeric');

                        setChartConfig(prev => ({
                            ...prev,
                            xAxis: catCols.length > 0 ? catCols[0] : '',
                            yAxis: numCols.length > 0 ? numCols[0] : 'count'
                        }));
                    }
                } else {
                    console.error("Invalid data format", json);
                    setError(`Invalid data format: ${JSON.stringify(json).slice(0, 200)}`);
                    setData([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setError(`Failed to load data: ${err.message}`);
                setLoading(false);
            });
    }, [selectedFileId]);

    const calculateStats = (rows) => {
        if (!rows.length) return {};
        const keys = Object.keys(rows[0]);
        const newStats = {};

        keys.forEach(key => {
            const values = rows.map(r => r[key]);
            const unique = new Set(values).size;

            // Determine type (simplified)
            // consider it numeric if > 90% values are numbers
            const numCount = values.filter(v => typeof v === 'number').length;
            const isNumber = (numCount / values.length) > 0.9;

            // Top Values / Frequency
            const counts = {};
            values.forEach(v => {
                const val = String(v);
                counts[val] = (counts[val] || 0) + 1;
            });

            // Sort by frequency
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

            // Histogram data for charts (Top 10 values for simplicity in UI)
            const histData = sorted.map(([name, count]) => ({
                name: name.length > 10 ? name.substring(0, 8) + '...' : name,
                count
            }));

            newStats[key] = {
                unique,
                top: sorted, // [[val, count], ...]
                hist: histData,
                type: isNumber ? 'numeric' : 'categorical'
            };
        });

        return newStats;
    };

    // Prepare Data for Main Chart
    const chartData = useMemo(() => {
        if (!data.length || !chartConfig.xAxis) return [];

        // Aggregation Logic
        const grouped = {};

        data.forEach(row => {
            const key = row[chartConfig.xAxis];
            if (!grouped[key]) grouped[key] = { name: key, value: 0, count: 0 };

            grouped[key].count += 1;

            if (chartConfig.yAxis !== 'count') {
                const val = parseFloat(row[chartConfig.yAxis]) || 0;
                grouped[key].value += val;
            }
        });

        let result = Object.values(grouped);

        // If metric is 'count', value is count
        if (chartConfig.yAxis === 'count') {
            result = result.map(item => ({ ...item, value: item.count }));
        } else {
            // Calculate Average? Or Sum? Default Sum for Area/Production, maybe Avg for Yield
            // For simplicity, let's do SUM for now, or AVG if it's huge?
            // Let's stick to Sum for Area/Production.
        }

        // Sort by value desc and take top 10-15 for readability
        return result.sort((a, b) => b.value - a.value).slice(0, 15);
    }, [data, chartConfig]);

    const catColumns = Object.keys(stats).filter(k => stats[k].type === 'categorical');
    const numColumns = Object.keys(stats).filter(k => stats[k].type === 'numeric');

    return (
        <div className="flex h-[calc(100vh-100px)] bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Sidebar: Datasets */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Database className="w-4 h-4" /> {t.datasets}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {datasets.map(ds => (
                        <button
                            key={ds.id}
                            onClick={() => setSelectedFileId(ds.id)}
                            className={`
                                w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                ${selectedFileId === ds.id
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'text-gray-600 hover:bg-gray-100'}
                            `}
                        >
                            <TableIcon className="w-4 h-4 opacity-70" />
                            <span className="truncate">{ds.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Toolbar */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid className="w-4 h-4" /> {t.table}
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <BarChart3 className="w-4 h-4" /> {t.charts}
                            </button>
                        </div>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <div className="text-sm font-medium text-gray-500">
                            {data.length.toLocaleString()} {t.rows} • {Object.keys(stats).length} {t.columns}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-gray-50/50 p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">{t.error}: </strong>
                            <span className="block sm:inline">{error}</span>
                            <div className="mt-2 text-xs opacity-75">
                                Debug: SelectedID={selectedFileId}, DataLength={data.length}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">{t.loading}</div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-auto">
                                <table className="min-w-full border-collapse">
                                    <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                                        <tr>
                                            {Object.keys(stats).map(key => (
                                                <th key={key} className="border-r border-b border-gray-200 min-w-[150px] p-0 align-top text-left">
                                                    <div className="p-3">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                                                                {key}
                                                            </span>
                                                        </div>
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                {stats[key].unique} {t.unique}
                                                            </div>
                                                        </div>
                                                        <div className="h-12 w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={stats[key].hist}>
                                                                    <Bar dataKey="count" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {data.slice(0, 100).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 group">
                                                {Object.keys(stats).map(key => (
                                                    <td key={key} className="px-3 py-2 text-xs text-gray-600 border-r border-gray-100 truncate max-w-[150px]">
                                                        {row[key]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                                {/* Auto-Generated Charts for Categorical Columns */}
                                {catColumns.map((col, idx) => (
                                    <div key={col} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[350px]">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            {stats[col].unique <= 5 ? <PieChartIcon className="w-4 h-4 text-purple-500" /> : <BarChart3 className="w-4 h-4 text-blue-500" />}
                                            {t.distributionBy} {col}
                                        </h3>
                                        <div className="flex-1 min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {stats[col].unique <= 5 ? (
                                                    <PieChart>
                                                        <Pie
                                                            data={stats[col].top}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={5}
                                                            dataKey="1" // Value is at index 1 in [["Name", Count], ...]
                                                            nameKey="0" // Name is at index 0
                                                        >
                                                            {stats[col].top.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={stats[col].top.map(i => ({ name: i[0], count: i[1] }))} layout="vertical" margin={{ left: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            width={100}
                                                            tick={{ fontSize: 11 }}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            cursor={{ fill: '#f8fafc' }}
                                                        />
                                                        <Bar dataKey="count" fill={COLORS[idx % COLORS.length]} radius={[0, 4, 4, 0]} barSize={20} />
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 text-center">
                                            {t.topValuesShown}
                                        </div>
                                    </div>
                                ))}

                                {/* Numeric Summaries */}
                                {numColumns.map((col, idx) => (
                                    <div key={col} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[350px]">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-green-500" />
                                            {col} {t.overview}
                                        </h3>
                                        <div className="flex-1 flex flex-col gap-4 justify-center">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-lg text-center">
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.totalSum}</div>
                                                    <div className="text-xl font-bold text-gray-800 truncate">
                                                        {(data.reduce((sum, row) => sum + (parseFloat(row[col]) || 0), 0)).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg text-center">
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.average}</div>
                                                    <div className="text-xl font-bold text-gray-800">
                                                        {(data.reduce((sum, row) => sum + (parseFloat(row[col]) || 0), 0) / data.length).toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-32 w-full mt-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats[col].hist.slice(0, 10)}>
                                                        <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                                        <Tooltip />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                                <div className="text-center text-xs text-gray-400 mt-1">{t.frequencyDistribution}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
