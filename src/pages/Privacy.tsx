import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Seo } from '../lib/seo'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050508]">
      <Seo
        title="Privacy Policy — Blossom"
        description="How Blossom collects, uses, and protects your data."
      />
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black font-display mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: May 19, 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <p className="mb-2"><strong className="text-slate-200">[REPLACE: Full legal entity name, e.g., "Blossom Technologies Inc."]</strong> ("Blossom," "we," "us," or "our") is the data controller responsible for personal information processed in connection with the Blossom platform (the "Service"). Our registered office is at <strong className="text-slate-200">[REPLACE: Full business address]</strong>.</p>
              <p>This Privacy Policy explains how we collect, use, store, and share your personal information when you use the Service. By using the Service, you acknowledge the practices described here. For privacy questions or requests, contact us at <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a>.</p>
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
              <p className="mt-2">We never access your direct messages, private posts, or platform credentials. You can disconnect accounts at any time from your account settings.</p>

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
                <li>Generating personalized content scripts and recommendations</li>
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
              <h2 className="text-lg font-bold text-white mb-3">3. Legal Basis for Processing (EEA / UK Users)</h2>
              <p className="mb-2">If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, we rely on the following legal bases under the GDPR / UK GDPR to process your personal data:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Performance of a contract (Art. 6(1)(b)):</strong> To provide the Service you have signed up for — account management, AI analysis of content you submit, subscription billing, and customer support.</li>
                <li><strong className="text-slate-300">Legitimate interests (Art. 6(1)(f)):</strong> To secure the Service, prevent fraud, improve features through aggregated usage analytics, and communicate with you about Service updates. You may object to processing based on legitimate interests at any time (see Section 9).</li>
                <li><strong className="text-slate-300">Consent (Art. 6(1)(a)):</strong> For optional features such as connecting social media accounts, marketing emails (where applicable), and any non-essential cookies. You may withdraw consent at any time without affecting prior lawful processing.</li>
                <li><strong className="text-slate-300">Legal obligation (Art. 6(1)(c)):</strong> To comply with applicable laws, tax/accounting rules, lawful requests by public authorities, and to respond to legal claims.</li>
              </ul>
              <p className="mt-2">We do not process special categories of personal data (such as health, biometric, or political data) intentionally. Please do not submit such data through the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. AI Processing and Automated Decision-Making</h2>
              <p className="mb-2">A core part of our Service involves AI-powered analysis. Here is how your data flows through our AI systems:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Video analysis:</strong> Uploaded videos are processed to extract visual frames, which are sent to Google Gemini for AI analysis under Google's paid API terms applicable to our account.</li>
                <li><strong className="text-slate-300">Audio analysis:</strong> Audio is extracted from videos and analyzed on our servers for beats, energy patterns, drops, and musical sections. Audio metadata may be included in AI prompts for contextual analysis.</li>
                <li><strong className="text-slate-300">Text analysis:</strong> Captions, hooks, and narrative content are processed through AI models to generate insights on storytelling, engagement strategy, and viral potential.</li>
                <li><strong className="text-slate-300">Batch processing:</strong> Multiple analysis dimensions may be processed in parallel to deliver comprehensive results efficiently.</li>
              </ul>
              <p className="mt-2">We instruct our AI providers not to use your content to train their models, in accordance with the API tier under which we operate. We do not share your uploaded content with other users.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">4.1 Automated Decision-Making</h3>
              <p>The Service uses automated processing to generate scores, classifications, and recommendations (e.g., virality scores, hook classifications, format matches). These outputs are informational suggestions only. They do not produce legal or similarly significant effects on you within the meaning of GDPR Article 22. If you would like a human review of any automated output that materially affects your account, contact <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Third-Party Services (Sub-processors)</h2>
              <p className="mb-2">We rely on the following third-party services ("sub-processors") to operate the platform:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Supabase:</strong> Authentication, database storage, and real-time services. Your account data and analysis results are stored in Supabase with encryption at rest and in transit.</li>
                <li><strong className="text-slate-300">Google Gemini (Google LLC):</strong> AI-powered content analysis. Video frames and text content are sent to Google's API for processing under Google's API terms.</li>
                <li><strong className="text-slate-300">Paddle:</strong> Payment processing and subscription management. Paddle acts as our merchant of record and handles all financial transactions. Paddle's privacy policy governs payment data.</li>
                <li><strong className="text-slate-300">Instagram &amp; TikTok data providers (HikerAPI, LamaTok):</strong> We use authorized third-party APIs to retrieve publicly available social media data for trending content, influencer insights, and content analysis.</li>
                <li><strong className="text-slate-300">Hosting and infrastructure providers:</strong> Cloud hosting, content delivery, and logging providers used to run and monitor the Service.</li>
              </ul>
              <p className="mt-2">Each sub-processor is bound by data processing agreements consistent with applicable law. We encourage you to review each provider's privacy policy for a complete understanding of how your data may be processed.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Data Storage, Security, and Breach Notification</h2>
              <p className="mb-2">We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>All data is encrypted in transit using TLS/SSL</li>
                <li>Data at rest is encrypted using AES-256 encryption via Supabase</li>
                <li>Authentication tokens are securely managed and expire automatically</li>
                <li>Access to production systems is restricted to authorized personnel</li>
                <li>Uploaded video files are stored securely and access-controlled</li>
                <li>Payment data is handled entirely by Paddle and never touches our servers</li>
              </ul>
              <p className="mt-2">In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours of becoming aware of it (as required by GDPR Art. 33) and, where the breach is likely to result in a high risk to you, we will notify you without undue delay.</p>
              <p className="mt-2">While we take all reasonable precautions, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Data Sharing</h2>
              <p className="mb-3">We do not sell, rent, or trade your personal information. We may share your data only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Service providers:</strong> With third-party sub-processors listed above, solely for the purpose of operating the Service</li>
                <li><strong className="text-slate-300">Legal requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
                <li><strong className="text-slate-300">Safety:</strong> To protect the rights, property, or safety of Blossom, our users, or the public</li>
                <li><strong className="text-slate-300">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, in which case your data would remain subject to this Privacy Policy</li>
                <li><strong className="text-slate-300">Aggregated data:</strong> We may share anonymized, aggregated statistics that cannot be used to identify individual users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Data Retention</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Account data:</strong> Retained for the duration of your active account</li>
                <li><strong className="text-slate-300">Uploaded content:</strong> Stored for analysis purposes and available for deletion upon your request</li>
                <li><strong className="text-slate-300">Analysis results:</strong> Retained in your analysis history as long as your account is active</li>
                <li><strong className="text-slate-300">Usage logs:</strong> Retained for up to 12 months for service improvement and security purposes</li>
                <li><strong className="text-slate-300">Payment records:</strong> Retained as required by tax and financial regulations (typically 6–10 years depending on jurisdiction)</li>
              </ul>
              <p className="mt-2">After account deletion, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention or financial record-keeping).</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. Your Rights</h2>
              <p className="mb-2">Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong className="text-slate-300">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong className="text-slate-300">Deletion ("right to be forgotten"):</strong> Request deletion of your personal data and account</li>
                <li><strong className="text-slate-300">Portability:</strong> Request your data in a structured, commonly used, machine-readable format</li>
                <li><strong className="text-slate-300">Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong className="text-slate-300">Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong className="text-slate-300">Withdrawal of consent:</strong> Withdraw your consent at any time where processing is based on consent, without affecting prior lawful processing</li>
                <li><strong className="text-slate-300">Right not to be subject to solely automated decisions:</strong> See Section 4.1</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a>. We will respond within 30 days (extendable by an additional 60 days for complex requests, with notice to you).</p>
              <p className="mt-2"><strong className="text-slate-200">Right to lodge a complaint:</strong> If you are in the EEA, UK, or Switzerland and believe we have not addressed your concern adequately, you have the right to lodge a complaint with your local data protection supervisory authority. A list of EEA supervisory authorities is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">edpb.europa.eu</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">10. California Privacy Rights (CCPA / CPRA)</h2>
              <p className="mb-2">If you are a California resident, the California Consumer Privacy Act (as amended by the CPRA) gives you the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Right to know:</strong> Categories and specific pieces of personal information we collect, the sources, the business purpose, and the categories of recipients</li>
                <li><strong className="text-slate-300">Right to delete:</strong> Request deletion of personal information we have collected from you</li>
                <li><strong className="text-slate-300">Right to correct:</strong> Request correction of inaccurate personal information</li>
                <li><strong className="text-slate-300">Right to opt out of sale or sharing:</strong> See below</li>
                <li><strong className="text-slate-300">Right to limit use of sensitive personal information</strong></li>
                <li><strong className="text-slate-300">Right to non-discrimination</strong> for exercising any of these rights</li>
              </ul>
              <p className="mt-3"><strong className="text-slate-200">Do Not Sell or Share My Personal Information:</strong> Blossom does not sell your personal information for money, and does not share your personal information for cross-context behavioral advertising as those terms are defined under the CCPA/CPRA. We do not use third-party advertising cookies or trackers.</p>
              <p className="mt-2"><strong className="text-slate-200">Categories collected in the past 12 months:</strong> Identifiers (name, email, IP); commercial information (subscription history); internet activity (usage logs, search queries); audio/visual information (uploaded videos and audio); inferences (content preferences). We do not collect Social Security numbers, government IDs, precise geolocation, biometric data, or other categories of sensitive personal information.</p>
              <p className="mt-2"><strong className="text-slate-200">How to exercise California rights:</strong> Email <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a> with the subject line "California Privacy Request." We will verify your request using information associated with your account. You may use an authorized agent — written permission and verification of your identity will be required.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">11. Cookies and Local Storage</h2>
              <p className="mb-2">We use minimal browser storage for essential functionality:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Authentication tokens:</strong> Stored securely to maintain your logged-in session (Supabase Auth)</li>
                <li><strong className="text-slate-300">User preferences:</strong> Theme, layout, and interface settings</li>
                <li><strong className="text-slate-300">Payment widget:</strong> Paddle may set cookies necessary to process your transaction</li>
                <li><strong className="text-slate-300">OAuth providers:</strong> Google may set cookies when you sign in via Google</li>
                <li><strong className="text-slate-300">Session data:</strong> Temporary data required for the Service to function</li>
              </ul>
              <p className="mt-2">We do not use third-party advertising cookies, behavioral advertising trackers, or cross-site tracking technologies. We do not participate in ad networks.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">12. International Data Transfers</h2>
              <p className="mb-2">Our Service infrastructure and our sub-processors (including Google, Supabase, and Paddle) may process data in the United States and other countries outside your country of residence. When personal data is transferred outside the EEA, UK, or Switzerland, we rely on one or more of the following safeguards required by Chapter V of the GDPR:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Adequacy decisions</strong> of the European Commission where available (e.g., the EU–U.S. Data Privacy Framework for certified U.S. recipients)</li>
                <li><strong className="text-slate-300">Standard Contractual Clauses (SCCs)</strong> approved by the European Commission, and the UK International Data Transfer Addendum where applicable</li>
                <li><strong className="text-slate-300">Supplementary technical and organizational measures</strong> such as encryption in transit and at rest, access controls, and pseudonymization where appropriate</li>
              </ul>
              <p className="mt-2">You may request a copy of the transfer mechanisms used by contacting <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">13. Children's Privacy</h2>
              <p>The Service is not directed to children. We do not knowingly collect personal information from children under 16 (or under 13 in the United States, as defined by the Children's Online Privacy Protection Act, "COPPA"). If we become aware that we have collected personal data from a child under the applicable age without verified parental consent, we will take steps to delete that information promptly. If you believe a child has provided us with personal information, please contact <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a> immediately.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">14. Third-Party Links</h2>
              <p>The Service may contain links to third-party websites or social media platforms (such as Instagram and TikTok profiles, trending content, etc.). We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit through links on our platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">15. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. Material changes will be communicated via email or in-app notification at least 14 days before taking effect (or such longer period as required by applicable law). The "Last updated" date at the top of this page indicates when the policy was last revised.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">16. Contact Us</h2>
              <p className="mb-2">If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
              <p className="mb-1">Privacy inquiries: <a href="mailto:privacy@blossai.com" className="text-pink-400 hover:text-pink-300">privacy@blossai.com</a></p>
              <p className="mb-1">Mailing address: <strong className="text-slate-200">[REPLACE: Full mailing address]</strong></p>
              <p className="mt-3"><strong className="text-slate-200">EU / UK Representative (where applicable):</strong> <strong className="text-slate-200">[REPLACE: Name, address, and email of your appointed Article 27 GDPR / UK GDPR representative — required if you are not established in the EU/UK but offer services to data subjects there]</strong>.</p>
              <p className="mt-3 text-slate-400">We aim to respond to all privacy-related inquiries within 30 days.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
