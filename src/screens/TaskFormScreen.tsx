import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTaskStore } from '../store/taskStore';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

declare const CURRENT_USER_ID: string;

export default function TaskFormScreen({ route, navigation }: Props) {
  const existing = route.params?.task;
  const { addTask, editTask } = useTaskStore();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '');

  const handleSave = async () => {
    if (!title.trim()) return;
    if (existing) {
      await editTask({ ...existing, title, description, dueDate: dueDate || null });
    } else {
      await addTask(CURRENT_USER_ID, { title, description, dueDate: dueDate || undefined });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Due date (ISO — e.g. 2026-08-10T18:00:00Z)"
        value={dueDate}
        onChangeText={setDueDate}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
});
