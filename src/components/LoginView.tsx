import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.ts';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Crown, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { AppUser } from '../types.ts';

interface LoginViewProps {
  onSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [hasMasterUser, setHasMasterUser] = useState<boolean | null>(null);
  const [checkingMaster, setCheckingMaster] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if Master User exists on mount
  useEffect(() => {
    let isMounted = true;
    const verifyMasterStatus = async () => {
      try {
        // 1. Check local backend configuration first
        try {
          const res = await fetch('/api/auth/status');
          if (res.ok) {
            const data = await res.json();
            if (data.has_master_user) {
              if (isMounted) {
                setHasMasterUser(true);
                setIsRegistering(false);
                setCheckingMaster(false);
              }
              return;
            }
          }
        } catch (e) {
          console.warn('API auth status check skipped:', e);
        }

        // 2. Check Firestore /system/setup or /users collection
        try {
          const setupSnap = await getDoc(doc(db, 'system', 'setup'));
          if (setupSnap.exists() && setupSnap.data()?.masterRegistered) {
            if (isMounted) {
              setHasMasterUser(true);
              setIsRegistering(false);
              setCheckingMaster(false);
            }
            return;
          }

          const q = query(collection(db, 'users'), limit(1));
          const usersSnap = await getDocs(q);
          const exists = !usersSnap.empty;
          if (isMounted) {
            setHasMasterUser(exists);
            setIsRegistering(!exists); // If no user exists, show Master registration
            setCheckingMaster(false);
          }
        } catch (firestoreErr) {
          console.warn('Firestore users check:', firestoreErr);
          if (isMounted) {
            // Default to secure login mode
            setHasMasterUser(true);
            setIsRegistering(false);
            setCheckingMaster(false);
          }
        }
      } finally {
        if (isMounted) setCheckingMaster(false);
      }
    };

    verifyMasterStatus();
    return () => { isMounted = false; };
  }, []);

  const getPortugueseAuthError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos. Verifique suas credenciais.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado no sistema. Tente fazer login.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'Formato de e-mail inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas sem sucesso. Aguarde um momento e tente novamente.';
      default:
        return 'Ocorreu um erro na autenticação. Verifique os dados e tente novamente.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // SECURITY: If master user already exists, registration from the login screen is STRICTLY PROHIBITED
      if (isRegistering) {
        if (hasMasterUser) {
          setErrorMsg('Criação de novos usuários desabilitada na tela inicial. Apenas o Administrador Master pode criar e convidar novos operadores através do painel interno.');
          setIsRegistering(false);
          setLoading(false);
          return;
        }

        if (!name.trim()) {
          setErrorMsg('Por favor, informe seu nome completo.');
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });

        const newMasterUser: AppUser = {
          uid: cred.user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: 'admin',
          status: 'active',
          isMaster: true,
          createdAt: new Date().toISOString()
        };

        // Save profile in Firestore /users
        await setDoc(doc(db, 'users', cred.user.uid), newMasterUser);
        
        // Save setup marker in Firestore /system/setup
        try {
          await setDoc(doc(db, 'system', 'setup'), {
            masterRegistered: true,
            masterUid: cred.user.uid,
            masterEmail: newMasterUser.email,
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Could not write system/setup doc:', e);
        }

        // Notify server backend to lock registration permanently
        try {
          await fetch('/api/auth/set-master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newMasterUser.email })
          });
        } catch (e) {
          console.warn('Could not notify backend:', e);
        }

        setHasMasterUser(true);
        setIsRegistering(false);
        onSuccess(newMasterUser);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        let userProfile: AppUser = {
          uid: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: cred.user.email || email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };

        try {
          const profileDoc = await getDoc(doc(db, 'users', cred.user.uid));
          if (profileDoc.exists()) {
            userProfile = profileDoc.data() as AppUser;
          }
        } catch (e) {
          console.warn('Profile read fallback:', e);
        }

        onSuccess(userProfile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(getPortugueseAuthError(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-[#002139] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#1A94C5]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#c1ef6d]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#c1ef6d] shadow-inner">
            {isRegistering ? <Crown className="w-7 h-7 text-amber-400" /> : <ShieldCheck className="w-7 h-7" />}
          </div>

          <h1 className="text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
            ChatAnalytics
          </h1>

          {checkingMaster ? (
            <p className="text-xs text-slate-300 mt-1">
              Verificando configurações de segurança...
            </p>
          ) : isRegistering ? (
            <div className="mt-2 space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Crown className="w-3.5 h-3.5" />
                Configuração Inicial • Usuário Master
              </span>
              <p className="text-xs text-slate-300 max-w-xs mx-auto pt-1">
                Cadastre o Administrador Master da sua empresa. Este será o único usuário autorizado a gerenciar a plataforma e cadastrar novos operadores.
              </p>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Acesso seguro à plataforma de gestão de tráfego e conversões do Chatwoot
              </p>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo do Master *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#1A94C5] focus:ring-2 focus:ring-[#1A94C5]/20 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Por segurança, após a criação deste primeiro usuário, a criação de contas na tela inicial será permanentemente desativada. Novos operadores só poderão ser convidados dentro do sistema.
                </span>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              E-mail de Acesso *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#1A94C5] focus:ring-2 focus:ring-[#1A94C5]/20 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Senha de Acesso *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#1A94C5] focus:ring-2 focus:ring-[#1A94C5]/20 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || checkingMaster}
              className="w-full py-3 px-4 rounded-xl bg-[#002139] hover:bg-[#00375a] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                <>
                  <span>{isRegistering ? 'Criar Usuário Master' : 'Acessar Sistema'}</span>
                  <ArrowRight className="w-4 h-4 text-[#c1ef6d]" />
                </>
              )}
            </button>
          </div>

          {/* Security policy footnote: once master exists, NO registration options appear */}
          {hasMasterUser && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Acesso restrito. Novos usuários são gerenciados pelo Administrador Master.</span>
            </div>
          )}
        </form>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        Protegido por Firebase Authentication • Fuso: America/Belem
      </p>
    </div>
  );
};
