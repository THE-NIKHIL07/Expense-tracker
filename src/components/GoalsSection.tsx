import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../db/schema';
import { useTheme } from '../theme/ThemeContext';
import { GoalCard } from './goals/GoalCard';
import { AddEditGoalModal } from './goals/AddEditGoalModal';
import { DepositModal } from './goals/DepositModal';

interface GoalsSectionProps {
  goals: Goal[];
  onAddGoal: (data: Omit<Goal, 'created_at'>) => void;
  onUpdateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'created_at'>>) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const { colors } = useTheme();

  const [activeTabFilter, setActiveTabFilter] = useState<'saving' | 'due'>('due');
  const [modalVisible, setModalVisible] = useState(false);
  const [targetTypeForAdd, setTargetTypeForAdd] = useState<'saving' | 'due'>('due');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);
  const [depositModalVisible, setDepositModalVisible] = useState(false);

  const calculateDaysRemaining = (dueDateStr: string): number => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - t.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleOpenAdd = (type: 'saving' | 'due') => {
    setEditingGoal(null);
    setTargetTypeForAdd(type);
    setModalVisible(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTargetTypeForAdd(goal.category === 'Payment Due' ? 'due' : 'saving');
    setModalVisible(true);
  };

  const handleOpenDeposit = (goal: Goal) => {
    setSelectedGoalForDeposit(goal);
    setDepositModalVisible(true);
  };

  const handleSaveGoal = (data: {
    id?: string;
    title: string;
    target_amount: number;
    saved_amount: number;
    due_date: string;
    category: string;
    status: 'active' | 'completed';
  }) => {
    if (data.id) {
      onUpdateGoal(data.id, {
        title: data.title,
        target_amount: data.target_amount,
        saved_amount: data.saved_amount,
        due_date: data.due_date,
        category: data.category,
        status: data.status,
      });
    } else {
      const newGoal: Omit<Goal, 'created_at'> = {
        id: `goal_${Date.now()}`,
        title: data.title,
        target_amount: data.target_amount,
        saved_amount: data.saved_amount,
        due_date: data.due_date,
        category: data.category,
        status: data.status,
      };
      onAddGoal(newGoal);
    }
  };

  const handleConfirmDeposit = (goal: Goal, amount: number) => {
    const newSaved = goal.saved_amount + amount;
    const isCompleted = goal.target_amount > 0 && newSaved >= goal.target_amount;
    onUpdateGoal(goal.id, {
      saved_amount: newSaved,
      status: isCompleted ? 'completed' : 'active',
    });
  };

  const activeGoals = goals.filter((g) => g.status !== 'completed');

  const filteredGoals = activeGoals
    .filter((g) => {
      if (activeTabFilter === 'saving') return g.category !== 'Payment Due';
      if (activeTabFilter === 'due') return g.category === 'Payment Due';
      return true;
    })
    .sort((a, b) => {
      const remainingA = calculateDaysRemaining(a.due_date);
      const remainingB = calculateDaysRemaining(b.due_date);
      return remainingA - remainingB;
    });

  const dueCount = activeGoals.filter((g) => g.category === 'Payment Due').length;
  const savingCount = activeGoals.filter((g) => g.category !== 'Payment Due').length;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.segmentedFilter,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTabFilter('due')}
          style={[
            styles.segmentBtn,
            activeTabFilter === 'due' && { backgroundColor: '#EF4444' },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTabFilter === 'due' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Payment Dues ({dueCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTabFilter('saving')}
          style={[
            styles.segmentBtn,
            activeTabFilter === 'saving' && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTabFilter === 'saving' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Savings Goals ({savingCount})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {activeTabFilter === 'due' ? 'Upcoming Payment Dues' : 'Target Savings Goals'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleOpenAdd(activeTabFilter)}
          style={[
            styles.addBtn,
            { backgroundColor: activeTabFilter === 'due' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 102, 255, 0.15)' },
          ]}
        >
          <Ionicons
            name="add"
            size={16}
            color={activeTabFilter === 'due' ? '#EF4444' : colors.primary}
            style={{ marginRight: 2 }}
          />
          <Text
            style={[
              styles.addBtnText,
              { color: activeTabFilter === 'due' ? '#EF4444' : colors.primary },
            ]}
          >
            {activeTabFilter === 'due' ? '+ New Due' : '+ New Goal'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredGoals.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTabFilter === 'due'
              ? 'No active payment dues!'
              : 'No active savings goals!'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Create one to set deadlines and track payments easily.
          </Text>
        </View>
      ) : (
        filteredGoals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onDeposit={handleOpenDeposit}
            onEdit={handleOpenEdit}
            onDelete={onDeleteGoal}
            calculateDaysRemaining={calculateDaysRemaining}
          />
        ))
      )}

      <AddEditGoalModal
        visible={modalVisible}
        editingGoal={editingGoal}
        initialType={targetTypeForAdd}
        onClose={() => {
          setModalVisible(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <DepositModal
        visible={depositModalVisible}
        goal={selectedGoalForDeposit}
        onClose={() => {
          setDepositModalVisible(false);
          setSelectedGoalForDeposit(null);
        }}
        onConfirm={handleConfirmDeposit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  segmentedFilter: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
