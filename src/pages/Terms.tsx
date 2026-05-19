import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#050508]">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black font-display mb-2">Terms of Use</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: May 19, 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="mb-2">These Terms of Use ("Terms") form a binding legal agreement between you and <strong className="text-slate-200">[REPLACE: Full legal entity name, e.g., "Blossom Technologies Inc., a Delaware corporation"]</strong>, with its registered office at <strong className="text-slate-200">[REPLACE: Full business address]</strong> ("Blossom," "we," "us," or "our"), governing your access to and use of the Blossom platform and all related services, features, content, websites, and applications (collectively, the "Service").</p>
              <p className="mb-2">By creating an account, clicking "I agree," or accessing or using the Service in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <a href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</a>. If you do not agree to all of these Terms, you must not access or use the Service.</p>
              <p>These Terms apply to all users, whether on a free or paid subscription plan. <strong className="text-slate-200">Section 18 contains a binding arbitration clause and class action waiver that affect your legal rights. Please read it carefully.</strong></p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
              <p className="mb-2">Blossom is a social media intelligence platform that provides:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Content Analysis:</strong> AI-powered analysis of social media content including visual, audio, narrative, engagement, and strategic dimensions</li>
                <li><strong className="text-slate-300">Viral Format Discovery:</strong> Curated library of proven viral content formats, hooks, and tactics</li>
                <li><strong className="text-slate-300">Trending Content:</strong> Aggregated trending posts from Instagram and TikTok</li>
                <li><strong className="text-slate-300">Influencer Insights:</strong> Discovery and analysis of influencer profiles and performance metrics</li>
                <li><strong className="text-slate-300">Scripts:</strong> AI-generated content scripts and recommendations based on analyzed patterns</li>
                <li><strong className="text-slate-300">Social Account Integration:</strong> Ability to connect your own Instagram and TikTok accounts for personalized insights</li>
              </ul>
              <p className="mt-2">The Service uses artificial intelligence (including Google Gemini) and third-party data APIs to generate analysis and recommendations. Results are provided as guidance and should not be considered guarantees of content performance.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Eligibility</h2>
              <p>You must be at least 16 years of age to use the Service. By using Blossom, you represent that you meet this requirement and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms. The Service is not available to any users previously suspended or terminated from the Service.</p>
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
              <p className="mb-2">Blossom offers multiple subscription tiers with varying features and usage limits. Key billing terms:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Paid subscriptions are billed in <strong className="text-slate-300">[REPLACE: billing currency, e.g., U.S. dollars (USD)]</strong> on a recurring monthly or annual basis through Paddle, our payment processor and merchant of record</li>
                <li><strong className="text-slate-300">Automatic renewal:</strong> Your subscription will automatically renew at the end of each billing period at the then-current price unless you cancel before the renewal date. You authorize us (via Paddle) to charge your payment method for each renewal.</li>
                <li>You may upgrade, downgrade, or cancel your subscription at any time from your account settings</li>
                <li>Cancellations take effect at the end of the current billing period — you retain access until then, and no partial refunds are issued for unused time except where required by law</li>
                <li>Plan-specific features (such as influencer insights) are only available during an active subscription to the applicable tier</li>
                <li>Free tier usage is subject to analysis limits and may have restricted access to certain features</li>
                <li>Prices are exclusive of applicable taxes (VAT, GST, sales tax), which will be added where required by law</li>
                <li>Refunds, where applicable, are handled in accordance with Paddle's refund policy and applicable consumer-protection law</li>
              </ul>
              <p className="mt-2">We reserve the right to change pricing with at least 30 days' notice. Price changes will not affect your current paid billing period and will take effect at your next renewal.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Content You Upload ("User Content")</h2>
              <p className="mb-2">When you upload videos, audio, images, text, or other content for analysis ("User Content"):</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>You retain all ownership rights to your original User Content</li>
                <li>You grant Blossom a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, reproduce, transmit, modify (e.g., extract frames, audio), and analyze your User Content solely for the purpose of operating, providing, securing, and improving the Service for you</li>
                <li>You grant Blossom a perpetual, irrevocable, royalty-free license to use de-identified, aggregated information derived from your User Content for product analytics, benchmarking, and Service improvement, provided such information does not identify you or your content</li>
                <li>You represent and warrant that (a) you own or have all necessary rights to your User Content, (b) you have all necessary consents from any individuals depicted, and (c) your User Content does not violate any third party's rights or any applicable law</li>
                <li>Uploaded content is processed using AI models and may be temporarily stored on our servers and transmitted to third-party AI providers (such as Google Gemini) for analysis</li>
                <li>You may request deletion of your User Content at any time by contacting <a href="mailto:support@blossomapp.ai" className="text-pink-400 hover:text-pink-300">support@blossomapp.ai</a> or via your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Third-Party Content and Data</h2>
              <p className="mb-2">The Service aggregates and analyzes publicly available content from third-party platforms including Instagram and TikTok. Regarding this content:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>We do not claim ownership of any third-party content displayed through the Service</li>
                <li>Third-party content is shown for analytical and educational purposes only, consistent with fair use / fair dealing principles where applicable</li>
                <li>Accuracy of third-party data (follower counts, engagement metrics, etc.) depends on external data providers and may not always be real-time</li>
                <li>We are not responsible for the availability, accuracy, or content of third-party platforms</li>
                <li>You must comply with the terms of service of any third-party platform when using insights derived from our analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Copyright Policy and DMCA Notices</h2>
              <p className="mb-2">Blossom respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act ("DMCA"), 17 U.S.C. § 512, and equivalent copyright laws in other jurisdictions.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">8.1 Reporting Infringement</h3>
              <p className="mb-2">If you believe that content available through the Service infringes your copyright, please send a written notice to our designated DMCA agent containing the following information required by 17 U.S.C. § 512(c)(3):</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>A physical or electronic signature of the copyright owner or authorized representative</li>
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the allegedly infringing material and its location on the Service (URL or sufficient detail to locate it)</li>
                <li>Your contact information (name, address, phone, email)</li>
                <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law</li>
                <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner</li>
              </ul>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">8.2 Designated DMCA Agent</h3>
              <p className="mb-2">Send notices to:</p>
              <p className="mb-1">DMCA Agent: <strong className="text-slate-200">[REPLACE: DMCA agent name / role]</strong></p>
              <p className="mb-1">Email: <a href="mailto:dmca@blossomapp.ai" className="text-pink-400 hover:text-pink-300">dmca@blossomapp.ai</a></p>
              <p className="mb-1">Mailing address: <strong className="text-slate-200">[REPLACE: Full mailing address for legal notices]</strong></p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">8.3 Counter-Notices</h3>
              <p>If your content was removed in response to a DMCA notice and you believe the removal was a mistake or misidentification, you may submit a counter-notice in accordance with 17 U.S.C. § 512(g). Knowingly making material misrepresentations in either a notice or counter-notice may result in liability for damages under 17 U.S.C. § 512(f).</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">8.4 Repeat Infringers</h3>
              <p>It is our policy to terminate, in appropriate circumstances, the accounts of users who are repeat infringers of intellectual property rights.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. Social Account Connections</h2>
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
              <h2 className="text-lg font-bold text-white mb-3">10. AI-Generated Analysis</h2>
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
              <h2 className="text-lg font-bold text-white mb-3">11. Acceptable Use</h2>
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
              <h2 className="text-lg font-bold text-white mb-3">12. Intellectual Property; Feedback</h2>
              <p className="mb-2">The Service and its original content, features, algorithms, design, and branding are and will remain the exclusive property of Blossom and its licensors. This includes but is not limited to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>The Blossom name, logo, and visual identity</li>
                <li>Analysis algorithms, scoring systems, and AI models</li>
                <li>Curated viral formats, hooks, and tactics databases</li>
                <li>User interface design and user experience patterns</li>
                <li>Documentation, marketing materials, and website content</li>
              </ul>
              <p className="mt-2">Nothing in these Terms grants you any right to use our trademarks, logos, or branding without prior written consent.</p>
              <p className="mt-2"><strong className="text-slate-200">Feedback:</strong> If you submit any ideas, suggestions, feature requests, bug reports, or other feedback regarding the Service ("Feedback"), you grant Blossom a worldwide, perpetual, irrevocable, royalty-free, fully sublicensable license to use, reproduce, modify, and exploit the Feedback for any purpose, without any obligation or compensation to you. You waive any moral rights in the Feedback to the maximum extent permitted by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">13. Disclaimer of Warranties</h2>
              <p className="mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Implied warranties of merchantability, fitness for a particular purpose, title, or non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, error-free, or secure</li>
                <li>Warranties regarding the accuracy or reliability of any analysis, data, or recommendation</li>
                <li>Warranties that the Service will meet your specific requirements or expectations</li>
                <li>Warranties arising from course of dealing or usage of trade</li>
              </ul>
              <p className="mt-2">Some jurisdictions do not allow the exclusion of certain warranties; in such jurisdictions, the foregoing exclusions apply to the maximum extent permitted by law and nothing in these Terms limits any non-waivable statutory rights you may have as a consumer.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">14. Limitation of Liability</h2>
              <p className="mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW, BLOSSOM AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Any indirect, incidental, special, consequential, exemplary, or punitive damages</li>
                <li>Loss of profits, revenue, data, goodwill, or business opportunities</li>
                <li>Content performance outcomes based on the Service's recommendations</li>
                <li>Actions taken by third-party platforms regarding your content or account</li>
                <li>Damages arising from unauthorized access to your account</li>
                <li>Service interruptions caused by third-party providers (Supabase, Google Gemini, Paddle, social data APIs, hosting, networks)</li>
              </ul>
              <p className="mt-2">OUR TOTAL AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).</p>
              <p className="mt-2">Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for gross negligence, willful misconduct, fraud, or death or personal injury caused by negligence.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">15. Indemnification</h2>
              <p>You agree to defend, indemnify, and hold harmless Blossom, its affiliates, and their respective officers, directors, employees, and agents from any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or relating to: (a) your User Content; (b) your use of or access to the Service; (c) your violation of these Terms; (d) your violation of any rights of a third party, including intellectual property, privacy, or publicity rights; or (e) your violation of any applicable law. We reserve the right, at our own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will cooperate with us in asserting any available defenses.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">16. Suspension and Termination</h2>
              <p className="mb-2">We reserve the right to suspend or terminate your account if:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>You violate these Terms of Use</li>
                <li>You engage in abusive or fraudulent activity</li>
                <li>Your usage patterns suggest automated or unauthorized access</li>
                <li>Required by law or regulatory authorities</li>
              </ul>
              <p className="mt-2">Upon termination, your right to use the Service ceases immediately. You may request export or deletion of your data by contacting support. We may retain certain data as required by law or for legitimate business purposes.</p>
              <p className="mt-2">You may terminate your account at any time by cancelling your subscription and contacting <a href="mailto:support@blossomapp.ai" className="text-pink-400 hover:text-pink-300">support@blossomapp.ai</a>. We may also discontinue the Service (in whole or in part) at any time with reasonable advance notice where feasible.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">17. Force Majeure</h2>
              <p>Blossom shall not be liable for any failure or delay in performance under these Terms arising from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, epidemics, strikes, labor disputes, shortages of transportation, fuel, energy, labor, or materials, internet or telecommunications failures, denial-of-service attacks, or failures of third-party service providers (including but not limited to Supabase, Google Gemini, Paddle, HikerAPI, LamaTok, or hosting providers).</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">18. Governing Law, Dispute Resolution, and Class Action Waiver</h2>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.1 Governing Law</h3>
              <p>These Terms and any dispute arising out of or in connection with them or the Service shall be governed by and construed in accordance with the laws of <strong className="text-slate-200">[REPLACE: Governing jurisdiction, e.g., "the State of Delaware, United States, without regard to its conflict of laws principles"]</strong>. The United Nations Convention on Contracts for the International Sale of Goods does not apply.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.2 Informal Dispute Resolution</h3>
              <p>Before filing a claim, you agree to first contact us at <a href="mailto:legal@blossomapp.ai" className="text-pink-400 hover:text-pink-300">legal@blossomapp.ai</a> and attempt to resolve the dispute informally. We will attempt in good faith to resolve any dispute within sixty (60) days after receiving your written notice.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.3 Binding Arbitration</h3>
              <p>If we cannot resolve a dispute informally, you and Blossom agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved by binding individual arbitration administered by <strong className="text-slate-200">[REPLACE: Arbitration provider, e.g., "the American Arbitration Association (AAA) under its Consumer Arbitration Rules"]</strong>, and judgment on the award may be entered in any court of competent jurisdiction. The seat of arbitration shall be <strong className="text-slate-200">[REPLACE: City, State/Country]</strong>, and the language of arbitration shall be English.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.4 Class Action Waiver</h3>
              <p>YOU AND BLOSSOM AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION. The arbitrator may not consolidate more than one person's claims and may not preside over any form of representative or class proceeding.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.5 Exceptions and Opt-Out</h3>
              <p>Notwithstanding the above, either party may bring an individual action in small-claims court, and either party may seek injunctive or equitable relief in court for infringement of intellectual property rights. You may opt out of this arbitration agreement by sending written notice to <a href="mailto:legal@blossomapp.ai" className="text-pink-400 hover:text-pink-300">legal@blossomapp.ai</a> within thirty (30) days after first accepting these Terms.</p>

              <h3 className="text-sm font-bold text-slate-200 mt-4 mb-2">18.6 Exclusive Venue</h3>
              <p>For any claim not subject to arbitration, you and Blossom agree to submit to the exclusive jurisdiction of the state and federal courts located in <strong className="text-slate-200">[REPLACE: County/City, State/Country, e.g., "New Castle County, Delaware"]</strong>.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">19. Severability</h2>
              <p>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions remain in full force and effect. If the class action waiver in Section 18.4 is found unenforceable as to any claim, then the entire arbitration provision in Section 18 shall be unenforceable as to that claim, and such claim shall proceed in court in accordance with Section 18.6.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">20. Survival</h2>
              <p>The provisions of these Terms that by their nature should survive termination shall survive termination, including without limitation: Section 6 (license grants), Section 12 (Intellectual Property; Feedback), Section 13 (Disclaimer of Warranties), Section 14 (Limitation of Liability), Section 15 (Indemnification), Section 18 (Governing Law, Dispute Resolution, and Class Action Waiver), Section 19 (Severability), this Section 20, and Section 22 (Contact).</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">21. Changes to These Terms</h2>
              <p>We reserve the right to modify these Terms at any time. For material changes, we will provide notice via email or in-app notification at least 14 days before they take effect (or such longer period as required by applicable law). For non-material changes, we may update these Terms by posting the revised version with a new "Last updated" date. Your continued use of the Service after the effective date of any changes constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service and may cancel your subscription.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">22. Contact Us</h2>
              <p className="mb-2">If you have any questions about these Terms of Use, please contact us at:</p>
              <p className="mb-1">General support: <a href="mailto:support@blossomapp.ai" className="text-pink-400 hover:text-pink-300">support@blossomapp.ai</a></p>
              <p className="mb-1">Legal notices: <a href="mailto:legal@blossomapp.ai" className="text-pink-400 hover:text-pink-300">legal@blossomapp.ai</a></p>
              <p className="mb-1">DMCA notices: <a href="mailto:dmca@blossomapp.ai" className="text-pink-400 hover:text-pink-300">dmca@blossomapp.ai</a></p>
              <p className="mt-3 text-slate-400">Mailing address: <strong className="text-slate-200">[REPLACE: Full mailing address]</strong></p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
