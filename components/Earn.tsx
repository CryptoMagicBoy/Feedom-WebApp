'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import IceCube from '@/icons/IceCube';
import { useGameStore } from '@/utils/game-mechaincs';
import { capitalizeFirstLetter, formatNumber } from '@/utils/ui';
import { imageMap } from '@/images';
import { useHydration } from '@/utils/useHydration';
import Time from '@/icons/Time';
import { TASK_WAIT_TIME } from '@/utils/consts';
import { useToast } from '@/contexts/ToastContext';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  category: string;
  image: string;
  callToAction: string;
  taskData: any;
  taskStartTimestamp: Date | null;
  isCompleted: boolean;
}

interface TaskPopupProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

const TaskPopup: React.FC<TaskPopupProps> = React.memo(({ task, onClose, onUpdate }) => {
  const showToast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const { userTelegramInitData, incrementPoints } = useGameStore();
  const isHydrated = useHydration();

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/update/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: userTelegramInitData,
          taskId: task.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start task');
      }

      const data = await response.json();
      const updatedTask = {
        ...task,
        taskStartTimestamp: new Date(data.taskStartTimestamp),
      };
      onUpdate(updatedTask);
      showToast('Task started successfully!', 'success');
    } catch (error) {
      console.error('Error starting task:', error);
      showToast('Failed to start task. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [task, userTelegramInitData, onUpdate]);

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      let response;
      if (task.type === 'VISIT') {
        response = await fetch('/api/tasks/check/visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            initData: userTelegramInitData,
            taskId: task.id,
          }),
        });
      } else if (task.type === 'REFERRAL') {
        response = await fetch('/api/tasks/check/referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            initData: userTelegramInitData,
            taskId: task.id,
          }),
        });
      } else if (task.type === 'TELEGRAM') {
        // Assuming you have a separate endpoint for Telegram tasks
        response = await fetch('/api/tasks/check/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            initData: userTelegramInitData,
            taskId: task.id,
          }),
        });
      } else {
        throw new Error(`Unsupported task type: ${task.type}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to check ${task.type} task`);
      }

      const data = await response.json();

      if (data.success) {
        const updatedTask = { ...task, isCompleted: data.isCompleted };
        onUpdate(updatedTask);
        incrementPoints(updatedTask.points);
        showToast(data.message || 'Task completed successfully!', 'success');
      } else {
        // Task not completed, but no error
        if (task.type === 'REFERRAL' && data.currentReferrals !== undefined && data.requiredReferrals !== undefined) {
          const remainingReferrals = data.requiredReferrals - data.currentReferrals;
          showToast(`You need ${remainingReferrals} more referral${remainingReferrals > 1 ? 's' : ''} to complete this task. (${data.currentReferrals}/${data.requiredReferrals})`, 'error');
        } else {
          showToast(data.message || `Failed to complete ${task.type} task. Please try again.`, 'error');
        }
      }
    } catch (error) {
      console.error('Error checking task:', error);
      showToast(error instanceof Error ? error.message : `Failed to check ${task.type} task. Please try again.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRemaining = useCallback(() => {
    if (!task.taskStartTimestamp) return null;
    const now = new Date();
    const startTime = new Date(task.taskStartTimestamp);
    const elapsedTime = now.getTime() - startTime.getTime();
    const remainingTime = Math.max(TASK_WAIT_TIME - elapsedTime, 0);
    return remainingTime;
  }, [task.taskStartTimestamp]);

  const formatTime = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHydrated && task.taskStartTimestamp && !task.isCompleted) {
      intervalRef.current = setInterval(() => {
        const remaining = getTimeRemaining();
        setTimeRemaining(remaining);
        if (remaining === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onUpdate({ ...task });
        }
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isHydrated, task, getTimeRemaining, onUpdate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#272a2f] rounded-2xl p-6 max-w-sm w-full">
        <button onClick={onClose} className="float-right text-gray-400 hover:text-white">&times;</button>
        <Image src={imageMap[task.image]} alt={task.title} width={80} height={80} className="mx-auto mb-4" />
        <h2 className="text-3xl text-white text-center font-bold mb-2">{task.title}</h2>
        <p className="text-gray-300 text-center mb-4">{task.description}</p>
        <div className="flex justify-center mb-4">
          <button
            className="w-fit px-6 py-3 text-xl font-bold bg-blue-500 text-white rounded-2xl"
            onClick={() => {
              if (task.type === 'VISIT' && task.taskData.link) {
                window.open(task.taskData.link, '_blank');
              }
            }}
          >
            {task.callToAction}
          </button>
        </div>
        <div className="flex justify-center items-center mb-4">
          <IceCube className="w-6 h-6" />
          <span className="text-white font-bold text-2xl ml-1">+{formatNumber(task.points)}</span>
        </div>
        {task.type === 'VISIT' ? (
          <button
            className="w-full py-6 text-xl font-bold bg-green-500 text-white rounded-2xl flex items-center justify-center"
            onClick={task.taskStartTimestamp ? handleCheck : handleStart}
            disabled={isLoading || task.isCompleted}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-t-2 border-white border-solid rounded-full animate-spin"></div>
            ) : task.isCompleted ? (
              'Completed'
            ) : task.taskStartTimestamp ? (
              isHydrated ? (timeRemaining === 0 ? 'Check' : formatTime(timeRemaining || 0)) : 'Loading...'
            ) : (
              'Start'
            )}
          </button>
        ) : (
          <button
            className="w-full py-6 text-xl font-bold bg-green-500 text-white rounded-2xl flex items-center justify-center"
            onClick={handleCheck}
            disabled={isLoading || task.isCompleted}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-t-2 border-white border-solid rounded-full animate-spin"></div>
            ) : task.isCompleted ? (
              'Completed'
            ) : (
              'Check'
            )}
          </button>
        )}
      </div>
    </div>
  );
});

TaskPopup.displayName = 'TaskPopup';

const useFetchTasks = (userTelegramInitData: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?initData=${encodeURIComponent(userTelegramInitData)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userTelegramInitData]);

  return { tasks, setTasks, isLoading };
};

export default function Earn() {
  const { userTelegramInitData } = useGameStore();
  const { tasks, setTasks, isLoading } = useFetchTasks(userTelegramInitData);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === updatedTask.id ? updatedTask : t
      )
    );
  }, [setTasks]);

  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  return (
    <div className="bg-black flex justify-center">
      <div className="w-full bg-black text-white h-screen font-bold flex flex-col max-w-xl">
        <div className="flex-grow mt-4 bg-[#f3ba2f] rounded-t-[48px] relative top-glow z-0">
          <div className="absolute top-[2px] left-0 right-0 bottom-0 bg-[#1d2025] rounded-t-[46px] px-4 pt-1 pb-24 overflow-y-auto no-scrollbar">
            <div className="relative mt-4">
              <div className="flex justify-center mb-4">
                <IceCube className="w-24 h-24 mx-auto" />
              </div>
              <h1 className="text-2xl text-center mb-4">Earn More Ice</h1>

              {isLoading ? (
                <div className="text-center text-gray-400">Loading tasks...</div>
              ) : (
                Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <div key={category}>
                    <h2 className="text-base mt-8 mb-4">{capitalizeFirstLetter(category)}</h2>
                    <div className="space-y-2">
                      {categoryTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex justify-between items-center bg-[#272a2f] rounded-lg p-4 cursor-pointer"
                          onClick={() => !task.isCompleted && setSelectedTask(task)}
                        >
                          <div className="flex items-center">
                            <Image src={imageMap[task.image]} alt={task.title} width={40} height={40} className="rounded-lg mr-2" />
                            <div className="flex flex-col">
                              <span className="font-medium">{task.title}</span>
                              <div className="flex items-center">
                                <IceCube className="w-6 h-6 mr-1" />
                                <span className="text-white">+{formatNumber(task.points)}</span>
                              </div>
                            </div>
                          </div>
                          {task.isCompleted ? (
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : task.taskStartTimestamp ? (
                            <span className="text-yellow-500"><Time /></span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
      {selectedTask && (
        <TaskPopup
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}