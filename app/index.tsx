import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Task interface
interface Task {
    _id: Id<"tasks">;
    _creationTime: number;
    text: string;
    completed: boolean;
    notificationId: string;
    priority?: string;
}

// Priority types
type Priority = 'high' | 'medium' | 'low';

export default function HomeScreen() {
    const [taskText, setTaskText] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskPriority, setTaskPriority] = useState<Priority>('medium');
    const [priorityModalVisible, setPriorityModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    // Fetch tasks from Convex
    const tasks = useQuery(api.tasks.getTasks, {}) || [];

    // Sort tasks by priority and completion status
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = a.priority || 'medium';
        const bPriority = b.priority || 'medium';
        return priorityOrder[aPriority as Priority] - priorityOrder[bPriority as Priority];
    });

    // Convex mutations
    const createTask = useMutation(api.tasks.createTask);
    const updateTaskMutation = useMutation(api.tasks.updateTask);
    const deleteTaskMutation = useMutation(api.tasks.deleteTask);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            toast.success('Tasks updated');
        }, 1000);
    }, []);

    const addTask = async () => {
        if (taskText.trim() === '') return;

        try {
            if (editingTask) {
                await updateTaskMutation({
                    id: editingTask?._id,
                    text: taskText,
                    priority: taskPriority,
                });
                toast.success('Task updated');
                setEditingTask(null);
            } else {
                await createTask({
                    text: taskText,
                    notificationId: "",
                    priority: taskPriority,
                });
                toast.success('Task added');
            }
            setTaskText('');
            setTaskPriority('medium');
        } catch (error) {
            toast.error('Failed to save task');
        }
    };

    const toggleTaskCompletion = async (task: Task) => {
        try {
            const newCompletedState = !task?.completed;
            await updateTaskMutation({
                id: task?._id,
                completed: newCompletedState,
                notificationId: newCompletedState ? '' : task?.notificationId,
            });
            if (newCompletedState) {
                toast.success('Task completed');
            }
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const deleteTask = async (task: Task) => {
        try {
            await deleteTaskMutation({
                id: task?._id,
            });
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const editTask = (task: Task) => {
        setTaskText(task?.text);
        setTaskPriority((task?.priority as Priority) || 'medium');
        setEditingTask(task);
    };

    const updatePriority = (priority: Priority) => {
        setTaskPriority(priority);
        setPriorityModalVisible(false);
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return '#FF3B30';
            case 'medium': return '#FF9500';
            case 'low': return '#34C759';
            default: return '#FF9500';
        }
    };

    const getPriorityIcon = (priority?: string) => {
        switch (priority) {
            case 'high': return 'flag';
            default: return 'flag-outline';
        }
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <View style={[
            styles.taskItem,
            { borderLeftColor: getPriorityColor(item.priority) }
        ]}>
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleTaskCompletion(item)}
            >
                <View style={[
                    styles.checkbox,
                    item.completed && { backgroundColor: '#4A90E2', borderColor: '#4A90E2' }
                ]}>
                    {item.completed && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text
                    style={[
                        styles.taskText,
                        item.completed && styles.taskTextCompleted
                    ]}
                    numberOfLines={2}
                >
                    {item.text}
                </Text>

                <View style={styles.priorityIndicator}>
                    <Ionicons
                        name={getPriorityIcon(item.priority)}
                        size={12}
                        color={getPriorityColor(item.priority)}
                    />
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority || 'medium'}
                    </Text>
                </View>
            </View>

            <View style={styles.taskActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => editTask(item)}>
                    <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => deleteTask(item)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>My Tasks</Text>
                    <Text style={styles.subtitle}>
                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} remaining
                    </Text>
                </View>
                <TouchableOpacity onPress={() => onRefresh()}>
                    <Ionicons name="refresh-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <FlatList
                    data={sortedTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.taskListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4A90E2']}
                            tintColor={'#4A90E2'}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="clipboard-outline" size={80} color="#E0E0E0" />
                            <Text style={styles.emptyText}>No tasks found</Text>
                            <Text style={styles.emptySubtext}>Tap below to create your first task</Text>
                        </View>
                    }
                />

                <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="I want to..."
                            value={taskText}
                            onChangeText={setTaskText}
                            placeholderTextColor="#999"
                            onSubmitEditing={addTask}
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity
                            style={[styles.priorityBadge, { backgroundColor: getPriorityColor(taskPriority) + '20' }]}
                            onPress={() => setPriorityModalVisible(true)}
                        >
                            <Ionicons name="flag" size={18} color={getPriorityColor(taskPriority)} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, taskText.trim() === '' && styles.addButtonDisabled]}
                            onPress={addTask}
                            disabled={taskText.trim() === ''}
                        >
                            <Ionicons name={editingTask ? "checkmark" : "add"} size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={priorityModalVisible}
                onRequestClose={() => setPriorityModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setPriorityModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Priority</Text>
                        {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.priorityOption, taskPriority === p && { backgroundColor: getPriorityColor(p) + '10', borderColor: getPriorityColor(p) }]}
                                onPress={() => updatePriority(p)}
                            >
                                <Ionicons name={p === 'high' ? "flag" : "flag-outline"} size={22} color={getPriorityColor(p)} />
                                <Text style={[styles.priorityOptionText, { color: getPriorityColor(p) }]}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)} Priority
                                </Text>
                                {taskPriority === p && <Ionicons name="checkmark-circle" size={20} color={getPriorityColor(p)} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    header: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingBottom: 25,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    taskListContent: {
        padding: 20,
        paddingBottom: 20,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    checkboxContainer: {
        marginRight: 15,
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFAFA',
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        fontSize: 16,
        color: '#2D3436',
        fontWeight: '600',
        marginBottom: 4,
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#B2BEC3',
    },
    priorityIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    taskActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        paddingLeft: 20,
        paddingRight: 8,
        height: 60,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3436',
        paddingVertical: 10,
    },
    priorityBadge: {
        padding: 10,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    addButton: {
        backgroundColor: '#4A90E2',
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#B2BEC3',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#636E72',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#B2BEC3',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 20,
        textAlign: 'center',
    },
    priorityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    priorityOptionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 15,
    },
});