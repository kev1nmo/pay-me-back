import type { Group } from '../types';
import { useRates } from '../useRates';
import Members from './Members';
import ExpenseForm from './ExpenseForm';
import Balances from './Balances';
import ExpenseList from './ExpenseList';
import GroupSettings from './GroupSettings';

type Props = {
  group: Group;
  updateGroup: (fn: (g: Group) => Group) => void;
  onDelete: () => void;
};

export default function GroupView({ group, updateGroup, onDelete }: Props) {
  const rates = useRates(group.baseCurrency);

  return (
    <div className="grid">
      <div className="col">
        <Members group={group} updateGroup={updateGroup} />
        <ExpenseForm group={group} rates={rates} updateGroup={updateGroup} />
      </div>
      <div className="col">
        <Balances group={group} updateGroup={updateGroup} />
        <ExpenseList group={group} updateGroup={updateGroup} />
        <GroupSettings group={group} updateGroup={updateGroup} onDelete={onDelete} />
      </div>
    </div>
  );
}
