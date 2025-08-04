import { storage } from "../storage";

export async function generatePerformanceAnalytics(userId: string) {
  try {
    const [
      documentCount,
      recentDocuments,
      processingMetrics,
      accuracyMetrics,
      documents,
    ] = await Promise.all([
      storage.getUserDocumentCount(userId),
      storage.getUserDocuments(userId, 10),
      storage.getUserMetrics(userId, 'processing_time'),
      storage.getUserMetrics(userId, 'accuracy_score'),
      storage.getUserDocuments(userId, 30),
    ]);

    const analytics = {
      overview: {
        totalDocuments: documentCount,
        documentsThisMonth: getDocumentsThisMonth(documents),
        averageProcessingTime: calculateAverageProcessingTime(processingMetrics),
        averageAccuracyScore: calculateAverageAccuracy(documents),
      },
      charts: {
        documentsByDay: generateDocumentsByDay(documents),
        processingTimeChart: generateProcessingTimeChart(processingMetrics),
        accuracyTrend: generateAccuracyTrend(documents),
        documentTypes: generateDocumentTypesChart(documents),
      },
      recentActivity: recentDocuments.map(doc => ({
        id: doc.id,
        name: doc.originalName,
        status: doc.status,
        score: doc.score,
        createdAt: doc.createdAt,
      })),
    };

    return analytics;
  } catch (error) {
    console.error("Error generating performance analytics:", error);
    throw new Error("Failed to generate analytics");
  }
}

function getDocumentsThisMonth(documents: any[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return documents.filter(doc => 
    new Date(doc.createdAt) >= startOfMonth
  ).length;
}

function calculateAverageProcessingTime(metrics: any[]): number {
  if (metrics.length === 0) return 0;
  
  const total = metrics.reduce((sum, metric) => sum + parseFloat(metric.value), 0);
  return Math.round((total / metrics.length) * 100) / 100;
}

function calculateAverageAccuracy(documents: any[]): number {
  const documentsWithScores = documents.filter(doc => doc.score !== null);
  if (documentsWithScores.length === 0) return 0;
  
  const total = documentsWithScores.reduce((sum, doc) => sum + parseFloat(doc.score), 0);
  return Math.round((total / documentsWithScores.length) * 100) / 100;
}

function generateDocumentsByDay(documents: any[]): any[] {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      count: 0,
    };
  }).reverse();

  documents.forEach(doc => {
    const docDate = new Date(doc.createdAt).toISOString().split('T')[0];
    const dayData = last30Days.find(day => day.date === docDate);
    if (dayData) {
      dayData.count++;
    }
  });

  return last30Days;
}

function generateProcessingTimeChart(metrics: any[]): any[] {
  const last10Metrics = metrics.slice(0, 10).reverse();
  
  return last10Metrics.map((metric, index) => ({
    index: index + 1,
    time: parseFloat(metric.value),
    recordedAt: metric.recordedAt,
  }));
}

function generateAccuracyTrend(documents: any[]): any[] {
  const documentsWithScores = documents
    .filter(doc => doc.score !== null)
    .slice(0, 20)
    .reverse();

  return documentsWithScores.map((doc, index) => ({
    index: index + 1,
    score: parseFloat(doc.score),
    name: doc.originalName,
    createdAt: doc.createdAt,
  }));
}

function generateDocumentTypesChart(documents: any[]): any[] {
  const typeCount: { [key: string]: number } = {};
  
  documents.forEach(doc => {
    const type = getDocumentType(doc.mimeType);
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  return Object.entries(typeCount).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / documents.length) * 100),
  }));
}

function getDocumentType(mimeType: string | null): string {
  if (!mimeType) return 'Unknown';
  
  if (mimeType.startsWith('text/')) return 'Text';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  if (mimeType.includes('image/')) return 'Image';
  
  return 'Other';
}
