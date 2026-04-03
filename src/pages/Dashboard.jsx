import DashboardLayout from "../layout/DashboardLayout";
import StatPanel from "../components/StatPanel";
import AccountTable from '../components/AccountTable';
import { SAMPLE_STATS } from '../data/sampleData';

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* <SystemHealth /> */}
      <div className="">
        {/* <StatGrid /> */}
        {/* Row 1: Thống kê 3 cột */}
        <div className="flex flex-wrap lg:flex-nowrap gap-4">
          <StatPanel title="Server Statistics" stats={SAMPLE_STATS.server} />
          <StatPanel title="AMQP Statistics" stats={SAMPLE_STATS.amqp} />
          <StatPanel title="AMHS Statistics" stats={SAMPLE_STATS.amhs} />
        </div>
      </div>
      <div>
        {/* Row 2: Account Status */}
          <div className="space-y-4 mt-4">
             <AccountTable title="AMQP Account" data={[{name: 'DWD OPMET via AMQP', status: 'Bound Active', online: true}, {name: 'TEST_ACQ_AC', status: 'Disconnected', online: false}]} />
             <AccountTable title="AMHS Account" data={[{name: 'To AMHS', status: 'Bound Active', online: true}, {name: 'From AMHS', status: 'Bound Active', online: true}]} />
          </div>
      </div>
    </DashboardLayout>
  );
}