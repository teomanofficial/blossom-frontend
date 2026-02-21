import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Terms of Use</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: February 21, 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="mb-2">By creating an account, accessing, or using Blossom AI ("the Service," "we," "us," or "our"), you agree to be bound by these Terms of Use. If you do not agree to all of these terms, you must not access or use the Service.</p>
              <p>These terms apply to all users, whether on a free or paid subscription plan. We may update these terms at any time — continued use of the Service after changes constitutes acceptance of the revised terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
              <p className="mb-2">Blossom AI is a social media intelligence platform that provides:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Content Analysis:</strong> AI-powered analysis of social media content including visual, audio, narrative, engagement, and strategic dimensions</li>
                <li><strong className="text-slate-300">Viral Format Discovery:</strong> Curated library of proven viral content formats, hooks, and tactics</li>
                <li><strong className="text-slate-300">Trending Content:</strong> Aggregated trending posts from Instagram and TikTok</li>
                <li><strong className="text-slate-300">Influencer Insights:</strong> Discovery and analysis of influencer profiles and performance metrics</li>
                <li><strong className="text-slate-300">Content Suggestions:</strong> AI-generated content ideas and recommendations based on analyzed patterns</li>
                <li><strong className="text-slate-300">Social Account Integration:</strong> Ability to connect your own Instagram and TikTok accounts for personalized insights</li>
              </ul>
              <p className="mt-2">The Service uses artificial intelligence (including Google Gemini) and third-party data APIs to generate analysis and recommendations. Results are provided as guidance and should not be considered guarantees of content performance.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Eligibility</h2>
              <p>You must be at least 16 years of age to use the Service. By using Blossom AI, you represent that you meet this requirement and have the legal capacity to enter into these terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Account Registration and Security</h2>
              <p className="mb-2">To use the Service, you must create an account using a valid email address or through Google sign-in. You agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Not share your account with others or create multiple accounts</li>
              </ul>
              <p className="mt-2">You are responsible for all activity that occurs under your account. We are not liable for any loss or damage arising from unauthorized access to your account.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Subscription Plans and Billing</h2>
              <p className="mb-2">Blossom AI offers multiple subscription tiers with varying features and usage limits. Key billing terms:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Paid subscriptions are billed on a recurring monthly or annual basis through Paddle, our payment processor</li>
                <li>You may upgrade, downgrade, or cancel your subscription at any time from your account settings</li>
                <li>Cancellations take effect at the end of the current billing period — you retain access until then</li>
                <li>Plan-specific features (such as influencer insights) are only available during an active subscription to the applicable tier</li>
                <li>Free tier usage is subject to analysis limits and may have restricted access to certain features</li>
                <li>Refunds are handled in accordance with Paddle's refund policy</li>
              </ul>
              <p className="mt-2">We reserve the right to change pricing with reasonable notice. Price changes will not affect your current billing period.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Content You Upload</h2>
              <p className="mb-2">When you upload videos or other content for analysis:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>You retain all ownership rights to your original content</li>
                <li>You grant us a limited, non-exclusive license to process, analyze, and store the content for the purpose of providing the Service</li>
                <li>You represent that you have the right to upload and analyze the content</li>
                <li>Uploaded content is processed using AI models and may be temporarily stored on our servers for analysis</li>
                <li>You may request deletion of your uploaded content at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Third-Party Content and Data</h2>
              <p className="mb-2">The Service aggregates and analyzes publicly available content from third-party platforms including Instagram and TikTok. Regarding this content:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>We do not claim ownership of any third-party content displayed through the Service</li>
                <li>Third-party content is shown for analytical and educational purposes only</li>
                <li>Accuracy of third-party data (follower counts, engagement metrics, etc.) depends on external data providers and may not always be real-time</li>
                <li>We are not responsible for the availability, accuracy, or content of third-party platforms</li>
                <li>You must comply with the terms of service of any third-party platform when using insights derived from our analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Social Account Connections</h2>
              <p className="mb-2">If you choose to connect your social media accounts (Instagram, TikTok):</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>You authorize us to access publicly available data from your connected profiles</li>
                <li>We only access data necessary to provide the Service's features</li>
                <li>You may disconnect your accounts at any time from your account settings</li>
                <li>Connection does not grant us the ability to post, modify, or delete content on your behalf</li>
                <li>Data retrieved from connected accounts is subject to our Privacy Policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. AI-Generated Analysis</h2>
              <p className="mb-2">Our Service uses artificial intelligence to generate content analysis, suggestions, and recommendations. You acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>AI-generated insights are suggestions, not guarantees of performance or outcomes</li>
                <li>Analysis results may vary and are influenced by the quality and nature of the input content</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
                <li>You are solely responsible for decisions made based on the Service's analysis and recommendations</li>
                <li>AI models are continuously improving, and analysis outputs may change over time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">10. Acceptable Use</h2>
              <p className="mb-2">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Infringe on intellectual property rights of content creators or platforms</li>
                <li>Harass, stalk, or monitor individuals using the Service's analysis tools</li>
                <li>Scrape, reproduce, or redistribute data obtained through the Service</li>
                <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
                <li>Use automated bots, scripts, or tools to access the Service beyond its intended interface</li>
                <li>Resell, sublicense, or commercially redistribute analysis results or content from the Service</li>
                <li>Upload content that is illegal, harmful, or violates the rights of others</li>
                <li>Circumvent any usage limits, feature restrictions, or access controls</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">11. Intellectual Property</h2>
              <p className="mb-2">The Service and its original content, features, algorithms, design, and branding are and will remain the exclusive property of Blossom AI. This includes but is not limited to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>The Blossom AI name, logo, and visual identity</li>
                <li>Analysis algorithms, scoring systems, and AI models</li>
                <li>Curated viral formats, hooks, and tactics databases</li>
                <li>User interface design and user experience patterns</li>
                <li>Documentation, marketing materials, and website content</li>
              </ul>
              <p className="mt-2">Nothing in these terms grants you any right to use our trademarks, logos, or branding without prior written consent.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">12. Disclaimer of Warranties</h2>
              <p className="mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Implied warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, error-free, or secure</li>
                <li>Warranties regarding the accuracy or reliability of any analysis, data, or recommendation</li>
                <li>Warranties that the Service will meet your specific requirements or expectations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">13. Limitation of Liability</h2>
              <p className="mb-2">To the maximum extent permitted by law, Blossom AI and its officers, directors, employees, and agents shall not be liable for:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Content performance outcomes based on the Service's recommendations</li>
                <li>Actions taken by third-party platforms regarding your content or account</li>
                <li>Damages arising from unauthorized access to your account</li>
              </ul>
              <p className="mt-2">Our total aggregate liability for any claims arising from or related to the Service shall not exceed the total amount you paid to us in the twelve (12) months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">14. Indemnification</h2>
              <p>You agree to indemnify and hold harmless Blossom AI from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these terms, or your violation of any rights of a third party.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">15. Suspension and Termination</h2>
              <p className="mb-2">We reserve the right to suspend or terminate your account if:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>You violate these Terms of Use</li>
                <li>You engage in abusive or fraudulent activity</li>
                <li>Your usage patterns suggest automated or unauthorized access</li>
                <li>Required by law or regulatory authorities</li>
              </ul>
              <p className="mt-2">Upon termination, your right to use the Service ceases immediately. You may request export or deletion of your data by contacting support. We may retain certain data as required by law or for legitimate business purposes.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">16. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these terms or your use of the Service shall be resolved through good-faith negotiation before pursuing formal legal remedies.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">17. Severability</h2>
              <p>If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining terms remain in full force and effect.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">18. Changes to These Terms</h2>
              <p>We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. Your continued use of the Service after the effective date of any changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">19. Contact Us</h2>
              <p className="mb-2">If you have any questions about these Terms of Use, please contact us at:</p>
              <p><a href="mailto:support@blossomapp.ai" className="text-pink-400 hover:text-pink-300">support@blossomapp.ai</a></p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
