import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-10">Last updated: February 18, 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Account information:</strong> Name, email address, and profile details you provide during registration</li>
                <li><strong className="text-slate-300">Content data:</strong> Videos and content you upload for analysis</li>
                <li><strong className="text-slate-300">Usage data:</strong> How you interact with the Service, features used, and analysis history</li>
                <li><strong className="text-slate-300">Payment data:</strong> Billing information processed securely through our payment provider (Paddle)</li>
                <li><strong className="text-slate-300">Connected accounts:</strong> Social media account data you choose to connect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>To provide and improve the Service</li>
                <li>To analyze content and generate insights</li>
                <li>To process payments and manage subscriptions</li>
                <li>To communicate with you about your account and the Service</li>
                <li>To provide customer support</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Data Storage and Security</h2>
              <p>Your data is stored securely using industry-standard encryption. We use Supabase for data storage, which provides enterprise-grade security including encryption at rest and in transit. Uploaded content is processed for analysis and stored securely on our servers.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
              <p className="mb-2">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Supabase:</strong> Authentication and database</li>
                <li><strong className="text-slate-300">Paddle:</strong> Payment processing</li>
                <li><strong className="text-slate-300">Google Gemini:</strong> AI-powered content analysis</li>
              </ul>
              <p className="mt-2">Each third-party service has its own privacy policy governing their use of your data.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with third-party services as described above, or as required by law. We may share anonymized, aggregated data for research or business purposes.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Cookies</h2>
              <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Data Retention</h2>
              <p>We retain your account data as long as your account is active. Uploaded content is retained for analysis purposes and can be deleted upon request. After account deletion, we remove your personal data within 30 days, except where retention is required by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. Children's Privacy</h2>
              <p>The Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">11. Contact</h2>
              <p>For privacy inquiries, contact us at <a href="mailto:privacy@blossomapp.ai" className="text-pink-400 hover:text-pink-300">privacy@blossomapp.ai</a>.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
