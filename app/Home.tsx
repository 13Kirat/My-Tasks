import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

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
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    // Fetch tasks from Convex
    const tasks = useQuery(api.tasks.getTasks, {}) || [];

    // Sort tasks by priority and completion status
    const sortedTasks = [...tasks].sort((a, b) => {
        // First sort by completion status (incomplete first)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // Then sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = a.priority || 'medium';
        const bPriority = b.priority || 'medium';

        return priorityOrder[aPriority as Priority] - priorityOrder[bPriority as Priority];
    });

    // Convex mutations
    const createTask = useMutation(api.tasks.createTask);
    const updateTaskMutation = useMutation(api.tasks.updateTask);
    const deleteTaskMutation = useMutation(api.tasks.deleteTask);

    // Request notification permissions
    useEffect(() => {
        registerForPushNotificationsAsync();

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    // Request notification permissions
    async function registerForPushNotificationsAsync() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission required', 'Push notifications need appropriate permissions.');
            return;
        }
    }

    // Schedule a notification for a task
    async function scheduleTaskReminder(taskText: string) {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Task Reminder',
                    body: `Time to complete: ${taskText}`,
                },
                trigger: { seconds: 60 }, // Reminder after 1 minute
            });

            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return '';
        }
    }

    // Cancel a scheduled notification
    async function cancelNotification(notificationId: string) {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }

    // Add a new task
    const addTask = async () => {
        if (taskText.trim() === '') return;

        if (editingTask) {
            // Update existing task
            await updateTaskMutation({
                id: editingTask._id,
                text: taskText,
                priority: taskPriority,
            });
            setEditingTask(null);
        } else {
            // Create new task
            const notificationId = await scheduleTaskReminder(taskText);
            await createTask({
                text: taskText,
                notificationId,
                priority: taskPriority,
            });
        }

        setTaskText('');
        setTaskPriority('medium');
    };

    // Toggle task completion
    const toggleTaskCompletion = async (task: Task) => {
        const newCompletedState = !task.completed;

        // If task is being marked as complete, cancel notification
        if (newCompletedState && task.notificationId) {
            await cancelNotification(task.notificationId);
        }

        await updateTaskMutation({
            id: task._id,
            completed: newCompletedState,
            // Clear notification ID if task is completed
            notificationId: newCompletedState ? '' : task.notificationId,
        });
    };

    // Delete a task
    const deleteTask = async (task: Task) => {
        if (task.notificationId) {
            await cancelNotification(task.notificationId);
        }

        await deleteTaskMutation({
            id: task._id,
        });
    };

    // Edit a task
    const editTask = (task: Task) => {
        setTaskText(task.text);
        setTaskPriority((task.priority as Priority) || 'medium');
        setEditingTask(task);
    };

    // Update task priority
    const updatePriority = async (priority: Priority) => {
        setTaskPriority(priority);
        setPriorityModalVisible(false);
    };

    // Get priority color
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return '#FF3B30';
            case 'medium':
                return '#FF9500';
            case 'low':
                return '#34C759';
            default:
                return '#FF9500'; // Default to medium
        }
    };

    // Get priority icon
    const getPriorityIcon = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'flag';
            case 'medium':
                return 'flag-outline';
            case 'low':
                return 'flag-outline';
            default:
                return 'flag-outline';
        }
    };

    // Render a task item
    const renderTaskItem = ({ item }: { item: Task }) => (
        <View style={[
            styles.taskItem,
            { borderLeftWidth: 4, borderLeftColor: getPriorityColor(item.priority) }
        ]}>
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleTaskCompletion(item)}
            >
                <View style={[
                    styles.checkbox,
                    item.completed && styles.checkboxChecked
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
                        size={14}
                        color={getPriorityColor(item.priority)}
                    />
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority || 'medium'}
                    </Text>
                </View>
            </View>

            <View style={styles.taskActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => editTask(item)}
                >
                    <Ionicons name="pencil" size={20} color="#4A90E2" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteTask(item)}
                >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text style={styles.title}>My Tasks</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingContainer}
            >
                <FlatList
                    data={sortedTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={item => item._id}
                    style={styles.taskList}
                    contentContainerStyle={styles.taskListContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="list" size={60} color="#CCCCCC" />
                            <Text style={styles.emptyText}>No tasks yet</Text>
                            <Text style={styles.emptySubtext}>Add a task to get started</Text>
                        </View>
                    }
                />

                <View style={styles.inputContainer}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a new task..."
                            value={taskText}
                            onChangeText={setTaskText}
                            returnKeyType="done"
                            onSubmitEditing={addTask}
                        />

                        <TouchableOpacity
                            style={[styles.priorityButton, { backgroundColor: getPriorityColor(taskPriority) }]}
                            onPress={() => setPriorityModalVisible(true)}
                        >
                            <Ionicons name="flag" size={20} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={addTask}
                            disabled={taskText.trim() === ''}
                        >
                            <Text style={styles.addButtonText}>
                                {editingTask ? 'Update' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Priority Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={priorityModalVisible}
                onRequestClose={() => setPriorityModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Priority</Text>

                        <TouchableOpacity
                            style={[styles.priorityOption, { borderColor: '#FF3B30' }]}
                            onPress={() => updatePriority('high')}
                        >
                            <Ionicons name="flag" size={24} color="#FF3B30" />
                            <Text style={styles.priorityOptionText}>High Priority</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.priorityOption, { borderColor: '#FF9500' }]}
                            onPress={() => updatePriority('medium')}
                        >
                            <Ionicons name="flag-outline" size={24} color="#FF9500" />
                            <Text style={styles.priorityOptionText}>Medium Priority</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.priorityOption, { borderColor: '#34C759' }]}
                            onPress={() => updatePriority('low')}
                        >
                            <Ionicons name="flag-outline" size={24} color="#34C759" />
                            <Text style={styles.priorityOptionText}>Low Priority</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setPriorityModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4A90E2',
        paddingVertical: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        paddingTop: 50
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    taskList: {
        flex: 1,
    },
    taskListContent: {
        padding: 16,
        paddingBottom: 100,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    checkboxContainer: {
        marginRight: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4A90E2',
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        fontSize: 16,
        marginBottom: 4,
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#888888',
    },
    priorityIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityText: {
        fontSize: 12,
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    taskActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 46,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    priorityButton: {
        width: 46,
        height: 46,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        marginLeft: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        height: 46,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888888',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#AAAAAA',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    priorityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
    },
    priorityOptionText: {
        fontSize: 16,
        marginLeft: 12,
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
});