import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [timeframes, setTimeframes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadTimeframes();
    loadAnalytics();
  }, [selectedTimeframe]);

  const loadTimeframes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${backendUrl}/api/analytics/timeframes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setTimeframes(response.data.timeframes);
    } catch (error) {
      console.error('Error loading timeframes:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${backendUrl}/api/analytics/dashboard?timeframe=${selectedTimeframe}&include_comparisons=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatNumber = (value) => {
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getPerformanceColor = (value, threshold = 0.7) => {
    if (value >= threshold) return 'text-green-400';
    if (value >= threshold * 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderPerformanceTab = () => {
    if (!analytics?.user_analytics?.performance_metrics) return null;
    const performance = analytics.user_analytics.performance_metrics;

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Accuracy Rate</h3>
            <p className={`text-2xl font-bold ${getPerformanceColor(performance.accuracy_rate)}`}>
              {formatPercentage(performance.accuracy_rate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {performance.correct_answers} / {performance.total_questions} correct
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Average Score</h3>
            <p className={`text-2xl font-bold ${getPerformanceColor(performance.average_score)}`}>
              {formatPercentage(performance.average_score)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Trend: {performance.performance_trend}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Questions Answered</h3>
            <p className="text-2xl font-bold text-blue-400">
              {formatNumber(performance.total_questions)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total assessments completed
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Performance Trend</h3>
            <p className={`text-2xl font-bold ${
              performance.performance_trend === 'improving' ? 'text-green-400' :
              performance.performance_trend === 'declining' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {performance.performance_trend === 'improving' ? '📈' :
               performance.performance_trend === 'declining' ? '📉' : '➡️'}
            </p>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {performance.performance_trend}
            </p>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        {performance.difficulty_breakdown && Object.keys(performance.difficulty_breakdown).length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Difficulty</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(performance.difficulty_breakdown).map(([difficulty, stats]) => (
                <div key={difficulty} className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-white capitalize">{difficulty}</h4>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Accuracy</span>
                      <span className={getPerformanceColor(stats.accuracy || 0)}>
                        {formatPercentage(stats.accuracy || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Questions</span>
                      <span className="text-gray-300">{stats.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Scores Trend */}
        {performance.recent_scores && performance.recent_scores.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Performance Trend</h3>
            <div className="flex items-end space-x-2 h-32">
              {performance.recent_scores.map((score, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t flex-1 min-w-0"
                  style={{ height: `${Math.max(score * 100, 5)}%` }}
                  title={`Assessment ${index + 1}: ${formatPercentage(score)}`}
                ></div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Last {performance.recent_scores.length} assessment scores
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderEngagementTab = () => {
    if (!analytics?.user_analytics?.engagement_metrics) return null;
    const engagement = analytics.user_analytics.engagement_metrics;
    const timeMetrics = analytics.user_analytics.time_metrics;

    return (
      <div className="space-y-6">
        {/* Engagement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Engagement Score</h3>
            <p className={`text-2xl font-bold ${getPerformanceColor(engagement.engagement_score)}`}>
              {formatPercentage(engagement.engagement_score)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Overall platform engagement
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Total Sessions</h3>
            <p className="text-2xl font-bold text-blue-400">
              {formatNumber(engagement.total_sessions)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Assessment sessions completed
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Study Streak</h3>
            <p className="text-2xl font-bold text-green-400">
              {timeMetrics?.current_study_streak || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Consecutive days
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Avg Session Time</h3>
            <p className="text-2xl font-bold text-purple-400">
              {timeMetrics ? formatTime(timeMetrics.average_session_time) : '0m'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per session average
            </p>
          </div>
        </div>

        {/* Feature Usage */}
        {engagement.feature_usage && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(engagement.feature_usage).map(([feature, count]) => (
                <div key={feature} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300 capitalize">
                    {feature.replace(/_/g, ' ')}
                  </span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Analysis */}
        {timeMetrics && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Time Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-400">Total Time Spent</h4>
                <p className="text-xl font-bold text-blue-400 mt-1">
                  {formatTime(timeMetrics.total_time_spent)}
                </p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-400">Time Efficiency</h4>
                <p className="text-xl font-bold text-green-400 mt-1">
                  {formatPercentage(timeMetrics.time_efficiency || 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-400">Peak Hours</h4>
                <p className="text-xl font-bold text-purple-400 mt-1">
                  {timeMetrics.peak_activity_times?.join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProgressTab = () => {
    if (!analytics?.user_analytics?.progress_metrics) return null;
    const progress = analytics.user_analytics.progress_metrics;
    const skills = analytics.user_analytics.skill_metrics;

    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Overall Progress</h3>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(progress.progress_percentage || 0)}%
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${progress.progress_percentage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Achievements</h3>
            <p className="text-2xl font-bold text-green-400">
              {progress.completed_achievements || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {progress.in_progress_achievements || 0} in progress
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Learning Velocity</h3>
            <p className="text-2xl font-bold text-purple-400">
              {formatPercentage(progress.learning_velocity || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Progress rate
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400">Skill Mastery</h3>
            <p className="text-2xl font-bold text-yellow-400">
              {formatPercentage(skills?.overall_mastery || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Average across subjects
            </p>
          </div>
        </div>

        {/* Skill Breakdown */}
        {skills?.strong_areas || skills?.weak_areas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.strong_areas && skills.strong_areas.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Strong Areas</h3>
                <div className="space-y-2">
                  {skills.strong_areas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300 capitalize">{area.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skills.weak_areas && skills.weak_areas.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Areas for Improvement</h3>
                <div className="space-y-2">
                  {skills.weak_areas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-yellow-400">⚠</span>
                      <span className="text-gray-300 capitalize">{area.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Milestones */}
        {progress.milestones && progress.milestones.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Milestones Achieved</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.milestones.map((milestone, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  milestone.achieved ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-700'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={milestone.achieved ? 'text-green-400' : 'text-gray-400'}>
                      {milestone.achieved ? '🏆' : '🔒'}
                    </span>
                    <span className="text-white font-medium">{milestone.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInsightsTab = () => {
    if (!analytics?.user_analytics) return null;
    const insights = analytics.user_analytics.insights || [];
    const recommendations = analytics.user_analytics.recommendations || [];

    return (
      <div className="space-y-6">
        {/* AI Insights */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            AI-Powered Insights
          </h3>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <p className="text-blue-200">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No insights available yet. Complete more activities to get personalized insights.</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Personalized Recommendations
          </h3>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <p className="text-green-200">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No recommendations available yet. Continue learning to get personalized suggestions.</p>
          )}
        </div>

        {/* Comparison Data */}
        {analytics.comparison_data && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Platform Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium text-white mb-2">Your Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-green-400">
                      {formatPercentage(analytics.comparison_data.performance_comparison?.user_accuracy || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement</span>
                    <span className="text-blue-400">
                      {formatPercentage(analytics.comparison_data.performance_comparison?.user_engagement || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium text-white mb-2">Platform Average</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-gray-300">
                      {formatPercentage(analytics.comparison_data.performance_comparison?.platform_average_accuracy || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement</span>
                    <span className="text-gray-300">
                      {formatPercentage(analytics.comparison_data.performance_comparison?.platform_average_engagement || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learning Analytics Dashboard</h1>
            <p className="text-gray-400">Comprehensive insights into your learning progress</p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              {timeframes.map((timeframe) => (
                <option key={timeframe.id} value={timeframe.id}>
                  {timeframe.name}
                </option>
              ))}
            </select>
            <button
              onClick={loadAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'performance', name: 'Performance', icon: '🎯' },
              { id: 'engagement', name: 'Engagement', icon: '⚡' },
              { id: 'progress', name: 'Progress', icon: '📈' },
              { id: 'insights', name: 'Insights', icon: '🧠' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderPerformanceTab()}
              </div>
              <div>
                {renderInsightsTab()}
              </div>
            </div>
          )}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'engagement' && renderEngagementTab()}
          {activeTab === 'progress' && renderProgressTab()}
          {activeTab === 'insights' && renderInsightsTab()}
        </div>

        {/* Last Updated */}
        {analytics && (
          <div className="text-center text-gray-500 text-sm">
            Last updated: {new Date(analytics.generated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;