import { useCapExStore } from '../../stores/capexStore';

const actions = useCapExStore(state => state.actions);
const adminSettings = useCapExStore(state => state.adminSettings); 