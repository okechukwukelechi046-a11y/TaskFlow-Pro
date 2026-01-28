import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { fetchTasks, updateTaskStatus } from '../../store/slices/taskSlice';
import { Task, TaskStatus } from '../../types/task';
import { RootState, AppDispatch } from '../../store';
import TaskCard from './TaskCard';
import { reorderTasks } from '../../utils/taskUtils';

interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

const TaskBoard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading, error } = useSelector((state: RootState) => state.tasks);
  const [columns, setColumns] = useState<Record<TaskStatus, Column>>({
    TODO: { id: 'TODO', title: 'To Do', tasks: [] },
    IN_PROGRESS: { id: 'IN_PROGRESS', title: 'In Progress', tasks: [] },
    REVIEW: { id: 'REVIEW', title: 'Review', tasks: [] },
    DONE: { id: 'DONE', title: 'Done', tasks: [] }
  });

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  useEffect(() => {
    const groupedTasks = tasks.reduce((acc, task) => {
      acc[task.status].tasks.push(task);
      return acc;
    }, { ...columns });
    
    setColumns(groupedTasks);
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      const newTasks = reorderTasks(
        columns[source.droppableId as TaskStatus].tasks,
        source.index,
        destination.index
      );
      
      setColumns(prev => ({
        ...prev,
        [source.droppableId]: {
          ...prev[source.droppableId as TaskStatus],
          tasks: newTasks
        }
      }));
    } else {
      const taskId = parseInt(draggableId);
      const newStatus = destination.droppableId as TaskStatus;
      
      try {
        await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading tasks...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(columns).map((column) => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-4 text-gray-700">
                {column.title} ({column.tasks.length})
              </h2>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[500px]"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-3"
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
