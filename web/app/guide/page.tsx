export default function GuidePage() {
    return (
        <main className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8">How to Use Managify</h1>

            {/* Quick Start */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">🚀 Quick Start</h2>
                <div className="prose prose-blue max-w-none">
                    <p className="text-gray-700">
                        Managify helps you track job applications and match them to your resume using AI. Follow these steps to get started:
                    </p>
                </div>
            </section>

            {/* Installing Extension */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">📥 Step 1: Install the Chrome Extension</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <ol className="space-y-3 list-decimal ml-5 text-gray-800">
                        <li>Click the <strong>&quot;Download Extension&quot;</strong> button on the dashboard</li>
                        <li>Extract the ZIP file to a permanent folder on your computer</li>
                        <li>Open Chrome and navigate to <code className="bg-blue-100 px-2 py-1 rounded">chrome://extensions/</code></li>
                        <li>Enable <strong>&quot;Developer mode&quot;</strong> using the toggle in the top-right corner</li>
                        <li>Click <strong>&quot;Load unpacked&quot;</strong> and select the extracted folder</li>
                        <li>Pin the Managify icon to your Chrome toolbar for easy access</li>
                    </ol>
                </div>
            </section>

            {/* Saving Jobs */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">💼 Step 2: Save Jobs</h2>
                <div className="space-y-4 text-gray-700">
                    <p>Once the extension is installed, you can save jobs from any job board:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <ol className="space-y-3 list-decimal ml-5">
                            <li>Visit any job posting on LinkedIn, Indeed, Workday, or other job boards</li>
                            <li>Click the <strong>Managify extension icon</strong> in your toolbar</li>
                            <li>Click <strong>&quot;Save to Managify&quot;</strong></li>
                            <li>The job will automatically be extracted and saved to your dashboard</li>
                        </ol>
                    </div>
                    <p className="text-sm text-gray-600">
                        ✨ The extension works with: LinkedIn, Indeed, Workday, Greenhouse, Lever, and most career sites!
                    </p>
                </div>
            </section>

            {/* Upload Resume */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">📄 Step 3: Upload Your Resume</h2>
                <div className="space-y-4 text-gray-700">
                    <p>Upload your resume so Managify can match it to jobs and provide insights:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <ol className="space-y-3 list-decimal ml-5">
                            <li>Go to the <strong>&quot;Resume&quot;</strong> page from the navigation</li>
                            <li>Click <strong>&quot;Upload Resume&quot;</strong></li>
                            <li>Select your PDF or text resume file (max 4MB)</li>
                            <li>Give it a name and click <strong>&quot;Upload&quot;</strong></li>
                            <li>Set it as your <strong>Master Resume</strong> to use for job matching</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* View Jobs */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">🎯 Step 4: View and Manage Jobs</h2>
                <div className="space-y-4 text-gray-700">
                    <p>Your saved jobs appear on the dashboard with helpful information:</p>
                    <ul className="space-y-2 ml-5 list-disc">
                        <li><strong>Job Cards</strong> - Each job shows title, company, location, and category</li>
                        <li><strong>Color-Coded Categories</strong> - Jobs are auto-categorized (Software Dev, Product, Marketing, etc.)</li>
                        <li><strong>Fit Score</strong> - AI analyzes how well the job matches your resume</li>
                        <li><strong>Status Tracking</strong> - Mark jobs as Applied, Interviewing, Offer, or Rejected</li>
                    </ul>
                </div>
            </section>

            {/* AI Features */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">🤖 AI-Powered Features</h2>
                <div className="space-y-4 text-gray-700">
                    <p>Click on any job to see AI-generated insights:</p>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                        <ul className="space-y-2 ml-5 list-disc">
                            <li><strong>Resume Match Score</strong> - See how well your skills align with the job</li>
                            <li><strong>Strengths Analysis</strong> - Discover what makes you a great fit</li>
                            <li><strong>Improvement Suggestions</strong> - Get tips to strengthen your application</li>
                            <li><strong>Tailored Resume</strong> - Generate a customized resume for each job</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Tips */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">💡 Pro Tips</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <ul className="space-y-2 ml-5 list-disc text-gray-800">
                        <li>Save jobs as you browse - don&apos;t wait until later!</li>
                        <li>Upload multiple resume versions for different job types</li>
                        <li>Review the AI analysis to improve your applications</li>
                        <li>Use the category filters to organize your job search</li>
                        <li>Update job statuses to track your application progress</li>
                    </ul>
                </div>
            </section>

            {/* Troubleshooting */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">🔧 Troubleshooting</h2>
                <div className="space-y-4">
                    <div className="border-l-4 border-red-400 bg-red-50 p-4">
                        <p className="font-semibold text-red-900 mb-2">Extension not working?</p>
                        <p className="text-sm text-red-800">Make sure you&apos;re on a job posting page, then refresh and try again. The extension works best on LinkedIn, Indeed, and company career sites.</p>
                    </div>
                    <div className="border-l-4 border-red-400 bg-red-50 p-4">
                        <p className="font-semibold text-red-900 mb-2">Resume upload failing?</p>
                        <p className="text-sm text-red-800">Ensure your file is under 4MB and in PDF or TXT format. Try converting complex PDFs to text first.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
