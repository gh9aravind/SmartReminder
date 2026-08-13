import React, { useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTaskStore } from '../store/taskStore';
import type { Task } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

// In a real app this comes from an auth store/context populated after login.
declare const CURRENT_USER_ID: string;

export default function TaskListScreen({ navigation }: Props) {
  const { tasks, loading, loadTasks, toggleComplete, removeTask } = useTaskStore();

  useEffect(() => {
    loadTasks(CURRENT_USER_ID);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={() => navigation.navigate('TaskForm', { task: item })}>
        <Text style={[styles.title, item.isCompleted && styles.completed]}>{item.title}</Text>
        {item.dueDate && <Text style={styles.due}>{new Date(item.dueDate).toLocaleString()}</Text>}
        {item.syncStatus !== 'synced' && <Text style={styles.pending}>⏳ {item.syncStatus}</Text>}
      </TouchableOpacity>
      <Button title={item.isCompleted ? 'Undo' : 'Done'} onPress={() => toggleComplete(item)} />
      <Button title="Delete" color="crimson" onPress={() => removeTask(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={() => loadTasks(CURRENT_USER_ID)}
        ListEmptyComponent={<Text style={styles.empty}>No tasks yet — add one!</Text>}
      />
      <Button title="+ New Task" onPress={() => navigation.navigate('TaskForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  rowMain: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  completed: { textDecorationLine: 'line-through', color: '#999' },
  due: { fontSize: 12, color: '#666' },
  pending: { fontSize: 11, color: '#e08a00' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
