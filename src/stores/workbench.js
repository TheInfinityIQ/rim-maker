import { computed, reactive, ref, shallowRef, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { applyBalanceProposal, undoBalanceProposal } from '@/utility/automaticBalance';

// Session-only shared state lets Balance review the actual selected draft, not a copy.
export const useWorkbenchStore = defineStore('workbench', () => {
  const weapons = reactive([]), selectedIndex = ref(0), modName = ref('TestMod');
  const selectedWeapon = computed(() => weapons[selectedIndex.value]);
  const undoRecord = shallowRef(null);
  function apply(weapon, proposal) {
    const record = applyBalanceProposal(weapon, proposal);
    if (record) undoRecord.value = { ...record, weapon: toRaw(weapon) };
    return Boolean(record);
  }
  function canUndo(weapon) {
    return Boolean(weapon && undoRecord.value?.weapon === toRaw(weapon) && weapon.gun.statBases.RangedWeapon_Cooldown === undoRecord.value.after);
  }
  function undo(weapon) {
    if (!canUndo(weapon) || !undoBalanceProposal(weapon, undoRecord.value)) return false;
    undoRecord.value = null; return true;
  }
  return { weapons, selectedIndex, selectedWeapon, modName, apply, undo, canUndo };
});
