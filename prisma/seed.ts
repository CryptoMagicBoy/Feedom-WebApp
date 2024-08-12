import 'tsconfig-paths/register';
import { earnData } from "@/utils/consts";
import prisma from '@/utils/prisma';
import { TaskType } from '@prisma/client';

async function main() {
  console.log('Start seeding...');

  for (const category of earnData) {
    for (const task of category.tasks) {
      // Convert the string type to TaskType enum
      const taskType = TaskType[task.type as keyof typeof TaskType];

      const createdTask = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          points: task.points,
          type: taskType, // Use the converted TaskType enum value
          category: category.category,
          image: task.image,
          callToAction: task.callToAction,
          taskData: task.taskData,
        },
      });
      console.log(`Created task with id: ${createdTask.id}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });