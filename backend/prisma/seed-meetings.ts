/**
 * 会议模块示例数据种子
 * 用法: npx ts-node prisma/seed-meetings.ts
 * 或: npm run seed:meetings (需在 package.json 添加脚本)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建会议示例数据...\n')

  // 确保有基础用户
  const users = await prisma.user.findMany({ take: 10 })

  if (users.length === 0) {
    console.log('⚠️  数据库中没有用户，先创建测试用户...')

    const testUsers = [
      { username: 'zhangsan', password: '123456', email: 'zhangsan@example.com', name: '张三', role: 'admin' },
      { username: 'lisi', password: '123456', email: 'lisi@example.com', name: '李四', role: 'user' },
      { username: 'wangwu', password: '123456', email: 'wangwu@example.com', name: '王五', role: 'user' },
      { username: 'zhaoliu', password: '123456', email: 'zhaoliu@example.com', name: '赵六', role: 'user' },
      { username: 'sunqi', password: '123456', email: 'sunqi@example.com', name: '孙七', role: 'user' },
    ]

    for (const u of testUsers) {
      try {
        await prisma.user.create({ data: u })
        console.log(`  ✅ 创建用户: ${u.name}`)
      } catch {
        console.log(`  ⏭️  用户已存在: ${u.name}`)
      }
    }
  }

  // 重新获取用户
  const allUsers = await prisma.user.findMany()
  if (allUsers.length < 2) {
    console.error('❌ 用户数量不足，无法创建示例数据')
    return
  }

  const organizer = allUsers[0]
  const participants = allUsers.slice(1)

  // 会议模板数据
  const now = new Date()
  const templates = [
    {
      title: '2026年4月第3周 - 周例会',
      description: '本周工作总结与下周计划安排\n\n议程：\n1. 上周工作完成情况回顾\n2. 本周重点工作安排\n3. 问题与协调事项\n4. 其他',
      type: 'weekly',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 30),
      location: '一楼会议室 A',
      status: 'scheduled' as const,
      participantCount: 4,
      tasks: [
        { title: '提交上周工作报告', priority: 'high' as const, dueOffset: -1 },
        { title: '整理本周需求清单', priority: 'medium' as const, dueOffset: 3 },
        { title: '更新项目进度表', priority: 'low' as const, dueOffset: 5 },
      ],
      attachments: [
        { name: '周报模板.docx', url: '#', size: 25600, type: 'docx' },
        { name: '上周工作总结.pptx', url: '#', size: 1048576, type: 'pptx' },
      ],
    },
    {
      title: '车间管理系统 v1.4 评审会',
      description: '评审 v1.4 版本需求和技术方案\n\n评审内容：\n- 缺陷检测模块优化方案\n- 生产管理报表功能\n- 用户权限体系重构\n\n请各模块负责人提前准备评审材料。',
      type: 'review',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0),
      location: '二楼会议室 B',
      status: 'scheduled' as const,
      participantCount: 3,
      tasks: [
        { title: '准备需求文档', priority: 'urgent' as const, dueOffset: 1 },
        { title: '技术方案预评审', priority: 'high' as const, dueOffset: 2 },
        { title: '风险评估报告', priority: 'medium' as const, dueOffset: 2 },
      ],
      attachments: [
        { name: 'v1.4 需求文档.pdf', url: '#', size: 2097152, type: 'pdf' },
        { name: '技术方案草稿.docx', url: '#', size: 512000, type: 'docx' },
      ],
    },
    {
      title: 'Q2 安全生产工作总结会',
      description: '总结 Q2 安全生产情况，部署 Q3 安全工作\n\n主要内容：\n1. Q2 安全事故回顾\n2. 安全隐患排查结果\n3. 安全培训计划执行情况\n4. Q3 安全工作重点',
      type: 'general',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 10, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 12, 0),
      location: '三楼大会议室',
      status: 'completed' as const,
      participantCount: 5,
      tasks: [
        { title: '编制 Q2 安全报告', priority: 'high' as const, dueOffset: -10 },
        { title: '汇总隐患排查台账', priority: 'medium' as const, dueOffset: -8 },
        { title: '制定 Q3 安全培训计划', priority: 'medium' as const, dueOffset: -3 },
      ],
      notes: '## 会议纪要\n\nQ2 安全生产情况总体良好，未发生重大安全事故。\n\n### 完成事项\n- 完成全员安全培训 2 次\n- 排查安全隐患 15 项，已整改 13 项\n- 更新安全操作规程\n\n### 待办事项\n- 剩余 2 项隐患需持续跟进\n- Q3 安全培训计划需在本周内提交',
      attachments: [
        { name: 'Q2 安全工作总结.pdf', url: '#', size: 3145728, type: 'pdf' },
        { name: '隐患排查台账.xlsx', url: '#', size: 102400, type: 'xlsx' },
        { name: '安全培训记录.pdf', url: '#', size: 1572864, type: 'pdf' },
      ],
    },
    {
      title: '紧急：生产线设备故障处理',
      description: '3号线轧机出现异常振动，需紧急召集相关人员讨论处理方案。\n\n当前状态：已停机\n影响范围：3号线生产计划延迟',
      type: 'emergency',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 8, 30),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 9, 30),
      location: '3号线现场',
      status: 'completed' as const,
      participantCount: 3,
      tasks: [
        { title: '设备检修方案制定', priority: 'urgent' as const, dueOffset: -3 },
        { title: '备件采购确认', priority: 'high' as const, dueOffset: -2 },
        { title: '生产计划调整', priority: 'high' as const, dueOffset: -1 },
      ],
      notes: '## 处理结果\n\n### 故障原因\n轴承磨损导致振动异常\n\n### 处理措施\n1. 更换轴承（预计 2 天）\n2. 调整3号线生产计划至1号线\n3. 备件已确认库存充足\n\n### 后续跟进\n- 设备部：跟踪维修进度\n- 生产部：调整排产计划\n- 质量部：检查3号线产品质量',
      attachments: [
        { name: '设备故障报告.pdf', url: '#', size: 524288, type: 'pdf' },
      ],
    },
    {
      title: '2026年5月第1周 - 周例会',
      description: '5月第一周工作安排\n\n议程：\n1. 4月工作总结\n2. 5月工作目标\n3. 重点项目进度确认',
      type: 'weekly',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21, 9, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21, 10, 30),
      location: '一楼会议室 A',
      status: 'scheduled' as const,
      participantCount: 4,
      tasks: [
        { title: '准备4月工作总结', priority: 'medium' as const, dueOffset: 18 },
        { title: '确认5月重点项目', priority: 'medium' as const, dueOffset: 18 },
      ],
      attachments: [],
    },
  ]

  for (const t of templates) {
    // 创建会议
    const meeting = await prisma.meeting.create({
      data: {
        title: t.title,
        description: t.description,
        type: t.type,
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        organizerId: organizer.id,
        status: t.status,
        notes: t.notes || null,
      },
    })

    console.log(`✅ 会议: ${t.title} (ID: ${meeting.id})`)

    // 添加参会人员
    const selectedParticipants = participants.slice(0, t.participantCount)
    for (const p of selectedParticipants) {
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId: p.id,
          status: t.status === 'completed' ? 'confirmed' : 'pending',
        },
      })
    }

    // 添加任务
    for (const task of t.tasks) {
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + task.dueOffset)
      await prisma.meetingTask.create({
        data: {
          meetingId: meeting.id,
          title: task.title,
          description: null,
          assigneeId: selectedParticipants[Math.floor(Math.random() * selectedParticipants.length)]?.id || null,
          dueDate,
          status: t.status === 'completed' ? 'done' : 'pending',
          priority: task.priority,
        },
      })
    }

    // 添加附件
    for (const att of t.attachments) {
      await prisma.meetingAttachment.create({
        data: {
          meetingId: meeting.id,
          name: att.name,
          url: att.url,
          size: att.size,
          type: att.type,
        },
      })
    }
  }

  console.log('\n🎉 示例数据创建完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
