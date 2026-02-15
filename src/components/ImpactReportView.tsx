import { useDonationStats } from '../hooks/useDonations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, TrendingUp, Users, Award } from 'lucide-react';

export function ImpactReportView() {
    const { stats, loading } = useDonationStats();

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Impact Report</h1>
                <p className="text-muted-foreground">
                    See how your contributions are making a difference
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Lives Impacted</CardDescription>
                        <CardTitle className="text-4xl text-green-700 dark:text-green-400">
                            {stats?.peopleHelped || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm text-green-600 dark:text-green-500">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Estimated based on contributions</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Contributed</CardDescription>
                        <CardTitle className="text-4xl text-blue-700 dark:text-blue-400">
                            ${stats?.totalAmount?.toLocaleString() || '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm text-blue-600 dark:text-blue-500">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span>Across {stats?.totalDonations || 0} donations</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                        <CardDescription>Community Status</CardDescription>
                        <CardTitle className="text-4xl text-purple-700 dark:text-purple-400">
                            Gold
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm text-purple-600 dark:text-purple-500">
                            <Award className="h-4 w-4 mr-1" />
                            <span>Top 10% of donors</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Impact Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Impact Area Breakdown</CardTitle>
                        <CardDescription>Distribution of your aid by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(stats?.byCategory || {}).map(([category, count]) => {
                                const total = stats?.totalDonations || 1;
                                const percentage = Math.round(((count as number) / total) * 100);

                                return (
                                    <div key={category} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="capitalize font-medium">{category}</span>
                                            <span className="text-muted-foreground">{count as number} donations ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Donation Timeline</CardTitle>
                        <CardDescription>Your contribution activity over time</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
                        <p>Detailed timeline visualization coming soon...</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
