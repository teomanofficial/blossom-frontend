import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: February 21, 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <p>Blossom AI ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use our social media intelligence platform ("the Service"). By using the Service, you consent to the practices described in this policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">1.1 Account Information</h3>
              <p className="mb-2">When you create an account, we collect:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Full name and display name</li>
                <li>Email address</li>
                <li>Profile avatar (if provided)</li>
                <li>Authentication credentials (managed securely via Supabase Auth or Google OAuth)</li>
                <li>Onboarding preferences (content niche, goals, experience level)</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">1.2 Content You Upload</h3>
              <p className="mb-2">When you use our content analysis features, we process:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Video files uploaded for analysis</li>
                <li>Audio extracted from video content for beat, energy, and music analysis</li>
                <li>Social media URLs submitted for analysis</li>
                <li>Metadata associated with uploaded content (file type, duration, dimensions)</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">1.3 Connected Social Accounts</h3>
              <p className="mb-2">If you connect your Instagram or TikTok accounts, we may access:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Public profile information (username, bio, follower/following counts)</li>
                <li>Public post data (captions, engagement metrics, timestamps)</li>
                <li>Content performance metrics available through public APIs</li>
              </ul>
              <p className="mt-2">We never access your direct messages, private posts, or credentials for these platforms. You can disconnect accounts at any time from your account settings.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">1.4 Usage Data</h3>
              <p className="mb-2">We automatically collect:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Features used and analysis history</li>
                <li>Search queries within the platform</li>
                <li>Interaction patterns (formats saved, content viewed)</li>
                <li>Device type, browser type, and general location (country level)</li>
                <li>Timestamps of activity and session duration</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">1.5 Payment Information</h3>
              <p>Payment processing is handled entirely by Paddle, our merchant of record. We do not store your credit card numbers, bank account details, or other sensitive financial data on our servers. We only receive transaction confirmations, subscription status, and billing history from Paddle.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
              <p className="mb-2">We use your information for the following purposes:</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">2.1 Providing the Service</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Performing AI-powered content analysis (visual, audio, narrative, engagement, strategic)</li>
                <li>Generating personalized content suggestions and recommendations</li>
                <li>Displaying trending content, viral formats, hooks, and tactics</li>
                <li>Providing influencer discovery and performance insights</li>
                <li>Managing your subscription and feature access</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">2.2 Improving the Service</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Analyzing usage patterns to improve features and user experience</li>
                <li>Monitoring AI analysis quality and accuracy</li>
                <li>Identifying and fixing bugs or performance issues</li>
                <li>Developing new features based on aggregated user behavior</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">2.3 Communication</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Sending account-related notifications (verification, password reset, subscription changes)</li>
                <li>Responding to support requests</li>
                <li>Notifying you of material changes to our terms or policies</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">2.4 Security and Compliance</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Detecting and preventing fraudulent or unauthorized access</li>
                <li>Enforcing our Terms of Use</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. AI Processing and Content Analysis</h2>
              <p className="mb-2">A core part of our Service involves AI-powered analysis. Here is how your data flows through our AI systems:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Video analysis:</strong> Uploaded videos are processed to extract visual frames, which are sent to Google Gemini for AI analysis. Frames are transmitted securely and are not retained by Google beyond the processing request.</li>
                <li><strong className="text-slate-300">Audio analysis:</strong> Audio is extracted from videos and analyzed locally on our servers for beats, energy patterns, drops, and musical sections. Audio metadata may be included in AI prompts for contextual analysis.</li>
                <li><strong className="text-slate-300">Text analysis:</strong> Captions, hooks, and narrative content are processed through AI models to generate insights on storytelling, engagement strategy, and viral potential.</li>
                <li><strong className="text-slate-300">Batch processing:</strong> Multiple analysis dimensions may be processed in parallel to deliver comprehensive results efficiently.</li>
              </ul>
              <p className="mt-2">We do not use your uploaded content to train AI models. Content is processed for analysis only and is not shared with other users.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
              <p className="mb-2">We rely on the following third-party services to operate the platform:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Supabase:</strong> Authentication, database storage, and real-time services. Your account data and analysis results are stored in Supabase with encryption at rest and in transit.</li>
                <li><strong className="text-slate-300">Google Gemini:</strong> AI-powered content analysis. Video frames and text content are sent to Google's API for processing. Google's data usage is governed by their API terms of service.</li>
                <li><strong className="text-slate-300">Paddle:</strong> Payment processing and subscription management. Paddle acts as our merchant of record and handles all financial transactions. Paddle's privacy policy governs payment data.</li>
                <li><strong className="text-slate-300">Instagram & TikTok data providers:</strong> We use authorized third-party APIs to retrieve publicly available social media data for trending content, influencer insights, and content analysis.</li>
              </ul>
              <p className="mt-2">Each third-party provider maintains their own privacy policy. We encourage you to review these policies for a complete understanding of how your data may be processed.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Data Storage and Security</h2>
              <p className="mb-2">We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>All data is encrypted in transit using TLS/SSL</li>
                <li>Data at rest is encrypted using AES-256 encryption via Supabase</li>
                <li>Authentication tokens are securely managed and expire automatically</li>
                <li>Access to production systems is restricted to authorized personnel</li>
                <li>Uploaded video files are stored securely and access-controlled</li>
                <li>Payment data is handled entirely by Paddle and never touches our servers</li>
              </ul>
              <p className="mt-2">While we take all reasonable precautions, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Data Sharing</h2>
              <p className="mb-3">We do not sell, rent, or trade your personal information. We may share your data only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Service providers:</strong> With third-party services listed above, solely for the purpose of operating the Service</li>
                <li><strong className="text-slate-300">Legal requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
                <li><strong className="text-slate-300">Safety:</strong> To protect the rights, property, or safety of Blossom AI, our users, or the public</li>
                <li><strong className="text-slate-300">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, in which case your data would remain subject to this Privacy Policy</li>
                <li><strong className="text-slate-300">Aggregated data:</strong> We may share anonymized, aggregated statistics that cannot be used to identify individual users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Data Retention</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Account data:</strong> Retained for the duration of your active account</li>
                <li><strong className="text-slate-300">Uploaded content:</strong> Stored for analysis purposes and available for deletion upon your request</li>
                <li><strong className="text-slate-300">Analysis results:</strong> Retained in your analysis history as long as your account is active</li>
                <li><strong className="text-slate-300">Usage logs:</strong> Retained for up to 12 months for service improvement and security purposes</li>
                <li><strong className="text-slate-300">Payment records:</strong> Retained as required by tax and financial regulations</li>
              </ul>
              <p className="mt-2">After account deletion, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention or financial record-keeping).</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Your Rights</h2>
              <p className="mb-2">Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong className="text-slate-300">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong className="text-slate-300">Deletion:</strong> Request deletion of your personal data and account</li>
                <li><strong className="text-slate-300">Portability:</strong> Request your data in a structured, commonly used format</li>
                <li><strong className="text-slate-300">Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong className="text-slate-300">Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong className="text-slate-300">Withdrawal of consent:</strong> Withdraw your consent at any time where processing is based on consent</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:privacy@blossomapp.ai" className="text-pink-400 hover:text-pink-300">privacy@blossomapp.ai</a>. We will respond to your request within 30 days.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. Cookies and Local Storage</h2>
              <p className="mb-2">We use minimal browser storage for essential functionality:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Authentication tokens:</strong> Stored securely to maintain your logged-in session</li>
                <li><strong className="text-slate-300">User preferences:</strong> Theme, layout, and interface settings</li>
                <li><strong className="text-slate-300">Session data:</strong> Temporary data required for the Service to function</li>
              </ul>
              <p className="mt-2">We do not use third-party tracking cookies, advertising cookies, or cross-site tracking technologies. We do not participate in ad networks or behavioral advertising.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">10. International Data Transfers</h2>
              <p>Our Service infrastructure may process data in different regions. When your data is transferred outside your country of residence, we ensure appropriate safeguards are in place, including encryption in transit and contractual protections with our service providers.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">11. Children's Privacy</h2>
              <p>The Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will take steps to delete that information promptly. If you believe a child under 16 has provided us with personal information, please contact us immediately.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">12. Third-Party Links</h2>
              <p>The Service may contain links to third-party websites or social media platforms (such as Instagram and TikTok profiles, trending content, etc.). We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit through links on our platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">13. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. The "Last updated" date at the top of this page indicates when the policy was last revised.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">14. Contact Us</h2>
              <p className="mb-2">If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
              <p className="mb-1"><a href="mailto:privacy@blossomapp.ai" className="text-pink-400 hover:text-pink-300">privacy@blossomapp.ai</a></p>
              <p className="mt-3 text-slate-400">We aim to respond to all privacy-related inquiries within 30 days.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
